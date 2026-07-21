/**
 * 容器内 JSAPI 调起(微信公众号 / 支付宝生活号 / 抖音 H5)
 */

import { invokeDouyinJsapi } from '@/shared/pay/douyin'

/** 微信 JSAPI 调起参数(通道 payBody JSON) */
export interface WechatJsapiPayBody {
  appId?: string
  timeStamp?: string
  timestamp?: string
  nonceStr?: string
  package?: string
  signType?: string
  paySign?: string
}

/**
 * 解析 payBody JSON
 */
export function parsePayBodyJson<T = Record<string, unknown>>(payBody: string): T {
  return JSON.parse(payBody) as T
}

/**
 * 等待 WeixinJSBridge 就绪
 */
function readyWeixinBridge(): Promise<void> {
  return new Promise((resolve) => {
    const w = window as any
    if (typeof w.WeixinJSBridge !== 'undefined') {
      resolve()
      return
    }
    document.addEventListener('WeixinJSBridgeReady', () => resolve(), { once: true })
    // 兜底超时(非微信环境)
    setTimeout(resolve, 3000)
  })
}

/**
 * 微信 JSAPI 支付
 * @returns ok | cancel | fail
 */
export async function invokeWechatJsapi(payBody: string): Promise<'ok' | 'cancel' | 'fail'> {
  const data = parsePayBodyJson<WechatJsapiPayBody>(payBody)
  await readyWeixinBridge()
  const bridge = (window as any).WeixinJSBridge
  if (!bridge?.invoke) {
    return 'fail'
  }
  return new Promise((resolve) => {
    bridge.invoke(
      'getBrandWCPayRequest',
      {
        appId: data.appId,
        timeStamp: data.timeStamp || data.timestamp,
        nonceStr: data.nonceStr,
        package: data.package,
        signType: data.signType || 'RSA',
        paySign: data.paySign,
      },
      (res: { err_msg?: string }) => {
        const msg = res?.err_msg || ''
        if (msg === 'get_brand_wcpay_request:ok') {
          resolve('ok')
        }
        else if (msg === 'get_brand_wcpay_request:cancel') {
          resolve('cancel')
        }
        else {
          resolve('fail')
        }
      },
    )
  })
}

/**
 * 等待 AlipayJSBridge 就绪
 */
function readyAlipayBridge(): Promise<void> {
  return new Promise((resolve) => {
    const w = window as any
    if (typeof w.AlipayJSBridge !== 'undefined') {
      resolve()
      return
    }
    document.addEventListener('AlipayJSBridgeReady', () => resolve(), { once: true })
    setTimeout(resolve, 3000)
  })
}

/**
 * 从 payBody 解析支付宝 tradeNO
 * 支持纯字符串 tradeNo、JSON { tradeNO } / { tradeNo }
 */
export function resolveAlipayTradeNo(payBody: string): string {
  const trimmed = payBody.trim()
  if (!trimmed.startsWith('{')) {
    return trimmed
  }
  try {
    const obj = parsePayBodyJson<Record<string, string>>(trimmed)
    return obj.tradeNO || obj.tradeNo || obj.trade_no || ''
  }
  catch {
    return trimmed
  }
}

/**
 * 支付宝 tradePay
 * @returns ok | cancel | fail
 */
export async function invokeAlipayTradePay(payBody: string): Promise<'ok' | 'cancel' | 'fail'> {
  const tradeNO = resolveAlipayTradeNo(payBody)
  if (!tradeNO) {
    return 'fail'
  }
  await readyAlipayBridge()
  const bridge = (window as any).AlipayJSBridge
  if (!bridge?.call) {
    return 'fail'
  }
  return new Promise((resolve) => {
    bridge.call('tradePay', { tradeNO }, (result: { resultCode?: string }) => {
      const code = result?.resultCode
      // 9000 成功; 6001 用户取消
      if (code === '9000') {
        resolve('ok')
      }
      else if (code === '6001') {
        resolve('cancel')
      }
      else {
        resolve('fail')
      }
    })
  })
}

/**
 * 按 clientEnv 调起 JSAPI
 */
export async function invokeJsapiByEnv(
  clientEnv: string,
  payBody: string,
): Promise<'ok' | 'cancel' | 'fail' | 'unsupported'> {
  if (clientEnv === 'wechat') {
    return invokeWechatJsapi(payBody)
  }
  if (clientEnv === 'alipay') {
    return invokeAlipayTradePay(payBody)
  }
  if (clientEnv === 'douyin') {
    // 抖音: 调用 invokeDouyinJsapi(throw 'cancel' 表示取消, 其他 Error 表示失败)
    try {
      await invokeDouyinJsapi(payBody)
      return 'ok'
    }
    catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg === 'cancel') {
        return 'cancel'
      }
      return 'fail'
    }
  }
  return 'unsupported'
}
