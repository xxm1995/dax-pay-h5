/**
 * 抖音 H5 JSAPI 调起核心实现
 *
 * 抖音 H5(在抖音 APP 内 webview) 调起支付的完整链路:
 * 1. 动态注入抖音开放平台 JS-SDK (douyin_open.umd.js v1.0.17)
 * 2. 调后端接口拿 sdk.config 验签包(client_key/timestamp/nonce_str/signature)
 * 3. `sdk.config({...})` 通过签名验证 → `sdk.ready` 回调
 * 4. `sdk.ttcjpay.dypay({sdk_info, success, fail})` 拉起抖音支付
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

/** ttcjpay.dypay 响应(res.code 是外层 JSB 状态, res.data.code 是支付状态) */
interface DypayResult {
  /** JSB 调用返回码: 1=成功, -1/-100=无权限, -2=客户端无此方法, -3=参数错误, 0=失败 */
  code?: number
  data?: {
    /** 支付状态: '0'=成功, '1'=取消, '2'=失败, '3'=业务传参错误, '4'=下单失败, '-1'=未知 */
    code?: string
    msg?: string
  }
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
 */
export async function fetchDouyinJsapiConfig(url: string): Promise<DouyinJsapiConfig> {
  return http.request<DouyinJsapiConfig>({
    url: DOUYIN_JSAPI_CONFIG_URL,
    method: RequestEnum.GET,
    params: { url },
  }, {
    // 由调用方自行处理错误展示
    isShowMessage: false,
  })
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
 * 完整流程: 注入 SDK → 拉取验签包 → sdk.config → ttcjpay.dypay → 解析结果
 *
 * @param payBody 通道返回的 sdk_info JSON 字符串
 * @throws Error('cancel') 用户取消
 * @throws Error 其他失败
 */
export async function invokeDouyinJsapi(payBody: string): Promise<void> {
  // 当前页面 URL(去掉 # 及后面), 作为 sdk.config 的 url 参数
  const url = location.href.split('#')[0]

  // 1. 注入 JS-SDK
  await ensureDouyinSdk()
  // 2. 拉取 sdk.config 验签包
  const cfg = await fetchDouyinJsapiConfig(url)
  // 3. sdk.config 验签
  await douyinSdkConfig(cfg)
  // 4. ttcjpay.dypay 调起支付
  const res = await callDypay(payBody)

  // 外层 code 校验(JSB_NO_PERMISSION/JSB_NO_HANDLER 等需明确报错)
  const outerCode = res.code
  if (outerCode === -1 || outerCode === -100) {
    throw new Error('Douyin JSB no permission (check JSBridge security domain config)')
  }
  if (outerCode === -2) {
    throw new Error('Douyin JSB no handler (upgrade Douyin App)')
  }
  if (outerCode === -3) {
    throw new Error('Douyin JSB params error (sdk_info invalid)')
  }

  // 支付状态码(在 res.data.code)
  const payCode = res.data?.code
  if (payCode === '0') {
    return
  }
  if (payCode === '1') {
    throw new Error('cancel')
  }
  throw new Error(`Douyin pay failed: ${payCode || 'unknown'} ${res.data?.msg || ''}`)
}
