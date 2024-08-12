import { http } from '@/utils/http/axios'
import type { Result } from '#/axios'

/**
 * 获取当前可用支付的环境
 */
export function getPayEnv(): Promise<Result<string>> {
  return http.request({
    url: '/demo/cashier/getPayEnv',
    method: 'get',
  })
}

/**
 * 获取微信授权请求页URL
 */
export function getWxAuthUrl(): Promise<Result<string>> {
  return http.request({
    url: '/demo/cashier/getWxAuthUrl',
    method: 'get',
  })
}

/**
 * 单独支付
 */
export function simplePayCashier(obj): Promise<Result<PayOrderResult>> {
  return http.request({
    url: '/demo/cashier/simplePayCashier',
    method: 'post',
    data: obj,
  })
}

/**
 * 发起支付后响应对象
 */
export interface PayOrderResult {
  // 支付参数体(通常用于发起异步支付的参数)
  payBody: string
}
