/**
 * 抖音 H5 JSAPI 调起核心实现
 *
 * 抖音 H5(在抖音 APP 内 webview) 调起支付的完整链路:
 * 1. 动态注入抖音开放平台 JS-SDK (douyin_open.umd.js v1.0.17)
 * 2. 调后端接口拿 sdk.config 验签包(client_key/timestamp/nonce_str/signature)
 * 3. `sdk.config({...})` 通过签名验证 → `sdk.ready` 回调
 * 4. `sdk.ttcjpay.dypay({sdk_info, success, fail})` 拉起抖音支付
 *
 * 页面级预取: OAuth 完成后可调用 prefetchDouyinJsapi, 并行加载 SDK + 验签包;
 * 点支付时 invokeDouyinJsapi 复用缓存, 去掉调起路径上的额外 RTT。
 *
 * 参考文档:
 * - JSAPI 调起: https://pay.douyinpay.com/wiki/639fd48f17c2f3021d237f61/64413fddc6217f024ae23ae9.md
 * - JS 接入指南: https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/sdk/web-app/js/js-access
 * - 验证签名:   https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/sdk/web-app/js/signature
 */
import { RequestEnum } from '@/shared/enums/httpEnum'
import { http } from '@/shared/utils/http/axios'
import { loadScript } from '@/shared/utils/load-script'

/** 抖音 JS-SDK 版本与 URL(1.0.17 双端回调一致, 文档推荐) */
const DOUYIN_SDK_URL = 'https://unpkg.byted-static.com/bridge/douyin_open/1.0.17/lib/douyin_open.umd.js'

/** 后端 sdk.config 验签接口路径 */
const DOUYIN_JSAPI_CONFIG_URL = '/unipay/assist/channel/douyin/jsapi-config'

/** 后端返回的 sdk.config 验签包 */
export interface DouyinJsapiConfig {
  /** 抖音开放平台 Client Key(网站应用 appid) */
  clientKey: string
  /** 时间戳(秒, 字符串) */
  timestamp: string
  /** 随机字符串 */
  nonceStr: string
  /** 服务端计算的 MD5 签名 */
  signature: string
}

/**
 * ttcjpay.dypay 响应
 * - 旧版 bridge.call: code 为数字型 JSB 状态, 支付结果在 data.code
 * - 新版 sdk.ttcjpay.dypay(≥1.0.17): 支付结果在顶层 code(字符串 '0'/'1'/…), 双端结构一致
 */
interface DypayResult {
  /**
   * 旧版: 数字 JSB 码(1=成功, -1/-100=无权限, -2=无方法, -3=参数错, 0=失败)
   * 新版: 字符串支付码('0'=成功, '1'=取消, '2'=失败 …)
   */
  code?: number | string
  data?: {
    /** 旧版支付状态: '0'=成功, '1'=取消, '2'=失败, '3'=业务传参错误, '4'=下单失败, '-1'=未知 */
    code?: string
    msg?: string
  }
  /** 新版失败文案(部分回调可能带 message) */
  msg?: string
  message?: string
}

/** 抖音 JSAPI 验签上下文(与后端通道应用解析对齐) */
export interface DouyinJsapiContext {
  orderNo?: string
  code?: string
  channelMchNo?: string
  capability?: string
  channelAppId?: string
}

/** 页面级预取缓存(url + ctx 一致时复用) */
interface DouyinPrefetchCache {
  key: string
  configPromise: Promise<DouyinJsapiConfig>
}

let prefetchCache: DouyinPrefetchCache | null = null

/**
 * 当前页 URL(去掉 # 及后面), 作为 sdk.config 的 url 参数
 */
function currentPageUrl(): string {
  return location.href.split('#')[0]
}

/**
 * 规范化预取缓存 key(url + 上下文字段)
 */
function buildPrefetchKey(url: string, ctx?: DouyinJsapiContext): string {
  return [
    url,
    ctx?.orderNo || '',
    ctx?.code || '',
    ctx?.channelMchNo || '',
    ctx?.capability || '',
    ctx?.channelAppId || '',
  ].join('|')
}

/**
 * 动态注入抖音 JS-SDK 并等待 window.DouyinOpenJSBridge 就绪
 * 多次调用会复用同一 Promise, 不会重复注入
 */
export async function ensureDouyinSdk(): Promise<void> {
  // SDK 已加载且 Bridge 已挂载
  if (typeof window !== 'undefined' && (window as any).DouyinOpenJSBridge) {
    return
  }
  await loadScript(DOUYIN_SDK_URL)
  // 加载后立即检查 Bridge
  if (typeof window === 'undefined' || !(window as any).DouyinOpenJSBridge) {
    throw new Error('DouyinOpenJSBridge not available (not in Douyin App webview?)')
  }
}

/**
 * 调后端接口获取 sdk.config 验签包
 *
 * @param url 当前页面 URL(不含 # 及后面部分)
 * @param ctx 通道上下文(与 OAuth 同源; orderNo / code / channelMchNo 三选一)
 */
export async function fetchDouyinJsapiConfig(
  url: string,
  ctx?: DouyinJsapiContext,
): Promise<DouyinJsapiConfig> {
  return http.request<DouyinJsapiConfig>({
    url: DOUYIN_JSAPI_CONFIG_URL,
    method: RequestEnum.GET,
    params: {
      url,
      orderNo: ctx?.orderNo,
      code: ctx?.code,
      channelMchNo: ctx?.channelMchNo,
      capability: ctx?.capability,
      channelAppId: ctx?.channelAppId,
    },
  }, {
    // 由调用方自行处理错误展示
    isShowMessage: false,
  })
}

/**
 * 页面级预取: 并行加载 JS-SDK + 拉取 sdk.config 验签包
 *
 * 须在 OAuth 完成(或无需授权)、当前页 URL 已稳定后调用;
 * 失败仅 console.warn, 不打断页面, 调起时走即时拉取兜底。
 *
 * @param ctx 通道上下文(orderNo/code 等, 与 invokeDouyinJsapi 一致)
 */
export function prefetchDouyinJsapi(ctx?: DouyinJsapiContext): void {
  if (typeof window === 'undefined') {
    return
  }
  const url = currentPageUrl()
  const key = buildPrefetchKey(url, ctx)
  // 同 key 已在预取中或已完成, 不重复发起
  if (prefetchCache?.key === key) {
    return
  }
  const configPromise = fetchDouyinJsapiConfig(url, ctx).catch((e) => {
    // 预取失败丢弃缓存, 调起时重新拉
    if (prefetchCache?.key === key) {
      prefetchCache = null
    }
    throw e
  })
  prefetchCache = { key, configPromise }
  // 并行加载 SDK(失败同样静默, 调起时再试)
  void ensureDouyinSdk().catch((e) => {
    console.warn('[douyin] prefetch sdk failed', e)
  })
  void configPromise.catch((e) => {
    console.warn('[douyin] prefetch jsapi-config failed', e)
  })
}

/**
 * 取预取缓存中的验签包; key 不匹配或失败则即时拉取
 */
async function resolveJsapiConfig(
  url: string,
  ctx?: DouyinJsapiContext,
): Promise<DouyinJsapiConfig> {
  const key = buildPrefetchKey(url, ctx)
  if (prefetchCache?.key === key) {
    try {
      return await prefetchCache.configPromise
    }
    catch {
      // 预取失败, 下面即时拉取
    }
  }
  const configPromise = fetchDouyinJsapiConfig(url, ctx)
  prefetchCache = { key, configPromise }
  return configPromise
}

/**
 * 调用 sdk.config + sdk.ready, 完成 JSBridge 权限校验
 * sdk.error 视为验签失败, reject
 */
export function douyinSdkConfig(cfg: DouyinJsapiConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    const sdk = (window as any).DouyinOpenJSBridge
    if (!sdk) {
      reject(new Error('DouyinOpenJSBridge not ready'))
      return
    }
    let settled = false
    sdk.config({
      params: {
        client_key: cfg.clientKey,
        signature: cfg.signature,
        timestamp: cfg.timestamp,
        nonce_str: cfg.nonceStr,
        url: location.href.split('#')[0],
      },
    })
    sdk.ready(() => {
      if (settled) {
        return
      }
      settled = true
      resolve()
    })
    sdk.error((res: { status_code?: number, status_msg?: string }) => {
      if (settled) {
        return
      }
      settled = true
      reject(new Error(`sdk.config failed: ${res?.status_code} ${res?.status_msg || ''}`))
    })
    // 兜底超时(非抖音环境 sdk.ready/error 都不触发)
    setTimeout(() => {
      if (settled) {
        return
      }
      settled = true
      reject(new Error('sdk.config timeout (not in Douyin App?)'))
    }, 4000)
  })
}

/**
 * 调用 ttcjpay.dypay 拉起抖音支付
 * 优先用 1.0.17 新版 sdk.ttcjpay.dypay(success/fail 双回调)
 * 兜底用老版 sdk.bridge.call('ttcjpay.dypay', ..., callback)
 *
 * @param sdkInfoJson 通道返回的 sdk_info JSON 字符串(appId/timeStamp/nonceStr/package/signType/paySign)
 */
export function callDypay(sdkInfoJson: string): Promise<DypayResult> {
  return new Promise((resolve, reject) => {
    const sdk = (window as any).DouyinOpenJSBridge
    if (!sdk) {
      reject(new Error('DouyinOpenJSBridge not ready'))
      return
    }
    // 1.0.17 新版调用方式
    if (sdk.ttcjpay && typeof sdk.ttcjpay.dypay === 'function') {
      sdk.ttcjpay.dypay({
        sdk_info: sdkInfoJson,
        success: (res: DypayResult) => resolve(res),
        fail: (res: DypayResult) => resolve(res),
      })
      return
    }
    // 老版兼容
    if (sdk.bridge && typeof sdk.bridge.call === 'function') {
      sdk.bridge.call(
        'ttcjpay.dypay',
        { sdk_info: sdkInfoJson },
        (res: DypayResult) => resolve(res),
      )
      return
    }
    reject(new Error('ttcjpay.dypay not registered in DouyinOpenJSBridge'))
  })
}

/**
 * 抖音 JSAPI 调起主入口
 *
 * 完整流程: 注入 SDK → 拉取验签包(优先预取缓存) → sdk.config → ttcjpay.dypay → 解析结果
 *
 * @param payBody 通道返回的 sdk_info JSON 字符串
 * @param ctx 通道上下文(orderNo/code 等, 与 OAuth 同源解析网站应用)
 * @throws Error('cancel') 用户取消
 * @throws Error 其他失败
 */
export async function invokeDouyinJsapi(
  payBody: string,
  ctx?: DouyinJsapiContext,
): Promise<void> {
  // 当前页面 URL(去掉 # 及后面), 作为 sdk.config 的 url 参数
  const url = currentPageUrl()

  // 1. 注入 JS-SDK(预取可能已完成)
  await ensureDouyinSdk()
  // 2. 验签包: 优先用页面级预取缓存
  const cfg = await resolveJsapiConfig(url, ctx)
  // 3. sdk.config 验签
  await douyinSdkConfig(cfg)
  // 4. ttcjpay.dypay 调起支付
  const res = await callDypay(payBody)

  // 仅数字型外层码才是旧版 JSB 错误(新版支付结果也是字符串 '0'/'1', 勿当 JSB 码)
  const outerCode = res.code
  if (typeof outerCode === 'number') {
    if (outerCode === -1 || outerCode === -100) {
      throw new Error('Douyin JSB no permission (check JSBridge security domain config)')
    }
    if (outerCode === -2) {
      throw new Error('Douyin JSB no handler (upgrade Douyin App)')
    }
    if (outerCode === -3) {
      throw new Error('Douyin JSB params error (sdk_info invalid)')
    }
  }

  // 支付状态码: 优先旧版 data.code, 兼容新版顶层字符串 code
  const payCode
    = res.data?.code
      ?? (typeof res.code === 'string' ? res.code : undefined)
  if (payCode === '0') {
    return
  }
  if (payCode === '1') {
    throw new Error('cancel')
  }
  const failMsg = res.data?.msg || res.msg || res.message || ''
  throw new Error(`Douyin pay failed: ${payCode || 'unknown'} ${failMsg}`.trim())
}
