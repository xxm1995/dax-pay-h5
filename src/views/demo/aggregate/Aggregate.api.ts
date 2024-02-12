import { http } from '@/utils/http/axios'
import { Result } from '#/axios'

/**
 * 获取支付信息
 */
export function getInfo(code): Promise<Result<AggregatePayInfo>> {
  return http.request({
    url: '/demo/aggregate/getInfo',
    method: 'get',
    params: { code },
  })
}

/**
 * 支付宝h5支付
 */
export function aliH5Pay(code): Promise<Result<PayOrderResult>> {
  return http.request({
    url: '/demo/aggregate/aliH5Pay',
    method: 'post',
    params: { code },
  })
}

/**
 * 获取微信H5预支付签名信息
 */
export function getWxJsapiPay(aggregateCode, openId): Promise<Result<WxJsapiSignResult>> {
  return http.request({
    url: '/demo/aggregate/getWxJsapiPay',
    method: 'post',
    params: { aggregateCode, openId },
  })
}

/**
 *支付信息
 */
export interface AggregatePayInfo {
  title?: string
  businessNo?: string
  amount?: number
}

/**
 * 发起支付后响应对象
 */
export interface PayOrderResult {
  payBody: string
}

/**
 * 微信Jsapi预支付签名返回信息
 */
export interface WxJsapiSignResult {
  appId?: string
  timeStamp?: string
  nonceStr?: string
  signType?: string
  paySign?: string
  package?: string
}
