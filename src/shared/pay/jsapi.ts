/**
 * 宿主 JSAPI 调起（微信 / 支付宝 / 抖音）
 * payBody 一般为通道返回的 JSON 字符串
 */

import type { DouyinJsapiContext } from '@/shared/pay/douyin'
import { invokeDouyinJsapi } from '@/shared/pay/douyin'

export interface WechatJsapiPayload {
  appId?: string
  timeStamp?: string
  timestamp?: string
  nonceStr?: string
  noncestr?: string
  package?: string
  signType?: string
  paySign?: string
  /** 部分通道嵌套 */
  [key: string]: unknown
}

/**
 * 解析 payBody JSON
 */
export function parseJsapiPayload(payBody: string): Record<string, unknown> | null {
  try {
    const data = JSON.parse(payBody)
    if (data && typeof data === 'object') {
      return data as Record<string, unknown>
    }
  }
  catch {
    // ignore
  }
  return null
}

/**
 * 微信内 JSAPI 调起支付
 * 兼容 WeixinJSBridge / 标准字段别名
 */
export function invokeWechatJsapi(payBody: string): Promise<void> {
  const raw = parseJsapiPayload(payBody)
  if (!raw) {
    return Promise.reject(new Error('invalid jsapi payload'))
  }
  const payload = raw as WechatJsapiPayload
  const timeStamp = String(payload.timeStamp ?? payload.timestamp ?? '')
  const nonceStr = String(payload.nonceStr ?? payload.noncestr ?? '')
  const pkg = String(payload.package ?? '')
  const signType = String(payload.signType ?? 'RSA')
  const paySign = String(payload.paySign ?? '')

  return new Promise((resolve, reject) => {
    const bridge = (window as any).WeixinJSBridge
    if (bridge && typeof bridge.invoke === 'function') {
      bridge.invoke(
        'getBrandWCPayRequest',
        {
          appId: payload.appId,
          timeStamp,
          nonceStr,
          package: pkg,
          signType,
          paySign,
        },
        (res: { err_msg?: string }) => {
          if (res?.err_msg === 'get_brand_wcpay_request:ok') {
            resolve()
          }
          else if (res?.err_msg === 'get_brand_wcpay_request:cancel') {
            reject(new Error('cancel'))
          }
          else {
            reject(new Error(res?.err_msg || 'wechat pay fail'))
          }
        },
      )
      return
    }
    // 桥未就绪：监听 WeixinJSBridgeReady
    document.addEventListener('WeixinJSBridgeReady', () => {
      invokeWechatJsapi(payBody).then(resolve).catch(reject)
    }, { once: true })
    // 超时兜底
    setTimeout(() => {
      if (!(window as any).WeixinJSBridge) {
        reject(new Error('WeixinJSBridge not ready'))
      }
    }, 3000)
  })
}

/**
 * 支付宝 JSAPI / tradePay
 */
export function invokeAlipayJsapi(payBody: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const tradeNO = (() => {
      const parsed = parseJsapiPayload(payBody)
      if (parsed) {
        return String(parsed.tradeNO ?? parsed.tradeNo ?? parsed.orderStr ?? '')
      }
      // 部分通道直接返回 tradeNO 字符串
      return payBody
    })()

    const ap = (window as any).ap
    if (ap && typeof ap.tradePay === 'function') {
      ap.tradePay({ tradeNO }, (res: { resultCode?: string }) => {
        if (res?.resultCode === '9000') {
          resolve()
        }
        else if (res?.resultCode === '6001') {
          reject(new Error('cancel'))
        }
        else {
          reject(new Error(res?.resultCode || 'alipay pay fail'))
        }
      })
      return
    }

    const bridge = (window as any).AlipayJSBridge
    if (bridge && typeof bridge.call === 'function') {
      bridge.call('tradePay', { tradeNO }, (res: { resultCode?: string }) => {
        if (res?.resultCode === '9000') {
          resolve()
        }
        else {
          reject(new Error(res?.resultCode || 'alipay pay fail'))
        }
      })
      return
    }

    reject(new Error('Alipay bridge not ready'))
  })
}

/**
 * 按 clientEnv 调起 JSAPI
 * @param clientEnv
 * @param payBody
 * @param douyinCtx 抖音验签上下文(orderNo/code), 与通道 OAuth 同源
 */
export async function invokeJsapiByEnv(
  clientEnv: string,
  payBody: string,
  douyinCtx?: DouyinJsapiContext,
): Promise<void> {
  if (clientEnv === 'wechat') {
    await invokeWechatJsapi(payBody)
    return
  }
  if (clientEnv === 'alipay') {
    await invokeAlipayJsapi(payBody)
    return
  }
  if (clientEnv === 'douyin') {
    // 抖音: 动态加载 JS-SDK + sdk.config 验签 + ttcjpay.dypay
    // 抛出 Error('cancel') 表示用户取消, 其他 Error 表示失败
    await invokeDouyinJsapi(payBody, douyinCtx)
    return
  }
  // 云闪付等: 一期无统一桥, 抛出由上层轮询兜底
  throw new Error(`jsapi not implemented for ${clientEnv}`)
}
