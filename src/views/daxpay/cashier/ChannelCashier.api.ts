import type { AuthResult } from '../auth/ChannelAuth.api'
import { http } from '@/utils/http/axios'
import type { Result } from '#/axios'


/**
 * 获取收银台信息
 */
export function getCashierInfo(cashierType: string, appId: string) {
  return http.request<Result<ChannelCashierConfigResult>>({
    url: '/unipay/ext/channel/cashier/getCashierType',
    method: 'GET',
    params: { cashierType, appId },
  })
}

/**
 * 获取收银台所需授权链接, 用于获取OpenId一类的信息
 */
export function generateAuthUrl(param: CashierAuthParam) {
  return http.request<Result<string>>({
    url: '/unipay/ext/channel/cashier/generateAuthUrl',
    method: 'POST',
    data: param,
  })
}

/**
 * 获取授权信息
 */
export function auth(param: CashierPayParam) {
  return http.request<Result<AuthResult>>({
    url: '/unipay/ext/channel/cashier/auth',
    method: 'POST',
    data: param,
  })
}

/**
 * 发起支付
 */
export function cashierPay(param: CashierPayParam) {
  return http.request<Result<PayResult>>({
    url: '/unipay/ext/channel/cashier/pay',
    method: 'POST',
    data: param,
  })
}

/**
 * 通道认证参数
 */
export interface CashierAuthParam {
  // 应用号
  appId?: string
  // 收银台类型
  cashierType?: string
  // 授权码
  authCode?: string
}

/**
 * 通道收银支付参数
 */
export interface CashierPayParam {
  // 应用号
  appId?: string
  // 收银台类型
  cashierType?: string
  // 支付金额
  amount?: number
  // 唯一标识
  openId?: string
  // 支付描述
  description?: string
}

/**
 * 支付结果
 */
export interface PayResult {

  // 支付状态
  status: string
  // 支付参数体
  payBody: string
  // 商户订单号
  bizOrderNo: string
  // 订单号
  orderNo: string
}

/**
 * 微信Jsapi预支付签名返回信息
 */
export interface WxJsapiSignResult {
  // 公众号ID，由商户传入
  appId?: string
  // 时间戳，自1970年以来的秒数
  timeStamp?: string
  // 随机串
  nonceStr?: string
  // 预支付ID
  package?: string
  // 微信签名方式：
  signType?: string
  // 微信签名
  paySign?: string
}

/**
 * 收银台配置信息
 */
export interface ChannelCashierConfigResult {
  // 应用号
  appId?: string
  // 收银台类型
  cashierType?: string
  // 收银台名称
  cashierName?: string
  // 支付通道
  channel?: string
  // 支付方式
  payMethod?: string
  // 是否开启分账
  allocation?: boolean
  // 自动分账
  autoAllocation?: boolean
}
