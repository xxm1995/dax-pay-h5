import { http } from '@/utils/http/axios'
import type { Result } from '#/axios'
import type { AuthResult } from '@/views/daxpay/auth/ChannelAuth.api'
import type { PayResult } from '@/views/daxpay/cashier/CashierCode.api'

/**
 * 获取收银台订单和配置信息
 */
export function getOrderAndConfig(orderNo, checkoutType) {
  return http.request<Result<CheckoutOrderAndConfigResult>>({
    url: '/unipay/checkout/getOrderAndConfig',
    method: 'GET',
    params: {
      orderNo,
      checkoutType,
    },
  })
}
/**
 * 获取聚合支付配置
 */
export function getAggregateConfig(orderNo, aggregateType) {
  return http.request<Result<AggregateOrderAndConfigResult>>({
    url: '/unipay/checkout/getAggregateConfig',
    method: 'GET',
    params: {
      orderNo,
      aggregateType,
    },
  })
}
/**
 * 获取收银台所需授权链接, 用于获取OpenId一类的信息
 */
export function generateAuthUrl(param: CheckoutAuthUrlParam) {
  return http.request<Result<string>>({
    url: '/unipay/checkout/generateAuthUrl',
    method: 'post',
    data: param,
  })
}
/**
 * 获取授权结果
 */
export function auth(param: CheckoutAuthCodeParam) {
  return http.request<Result<AuthResult>>({
    url: '/unipay/checkout/auth',
    method: 'post',
    data: param,
  })
}
/**
 * 发起普通支付
 */
export function checkoutPay(param: CheckoutPayParam) {
  return http.request<Result<PayResult>>({
    url: '/unipay/checkout/pay',
    method: 'post',
    data: param,
  })
}

/**
 * 发起聚合支付
 */
export function aggregatePay(param: CheckoutAggregatePayParam) {
  return http.request<Result<PayResult>>({
    url: '/unipay/checkout/aggregatePay',
    method: 'post',
    data: param,
  })
}

/**
 * 收银台认证链接生成参数
 */
export interface CheckoutAuthUrlParam {
  /** 要支付的订单号 */
  orderNo?: string
  /** 聚合支付类型 */
  aggregateType?: string
}
/**
 * 获取收银台认证结果参数
 */
export interface CheckoutAuthCodeParam {
  /** 要支付的订单号 */
  orderNo?: string
  /** 聚合支付类型 */
  aggregateType?: string
  /** 认证Code */
  authCode?: string
}

/**
 * 收银台支付参数
 */
export interface CheckoutPayParam {
  /** 订单号 */
  orderNo?: string
  /** 支付配置项ID */
  itemId?: string
  /** 唯一标识 */
  openId?: string
  /** 付款码 */
  barCode?: string
}

/**
 * 聚合支付参数
 */
export interface CheckoutAggregatePayParam {
  /** 订单号 */
  orderNo?: string
  /** 聚合支付类型 */
  aggregateType?: string
  /** 唯一标识 */
  openId?: string
}

/**
 * 收银台配置
 */
export interface CheckoutOrderAndConfigResult {
  /** 订单信息 */
  order: CheckoutOrderResult
  /** 收银台配置信息 */
  config: CheckoutConfigResult
  /** 收银台分类配置信息 */
  groupConfigs: CheckoutGroupConfigResult[]
}

/**
 * 收银台聚合支付配置
 */
export interface AggregateOrderAndConfigResult {
  /** 订单信息 */
  order: CheckoutOrderResult
  /** 收银台配置信息 */
  config: CheckoutConfigResult
  /** 收银台聚合配置信息 */
  aggregateConfig: AggregateConfigResult
}

/**
 * 订单信息
 */
export interface CheckoutOrderResult {
  /** 商户订单号 */
  bizOrderNo?: string
  /** 订单号 */
  orderNo?: string
  /** 标题 */
  title?: string
  /** 描述 */
  description?: string
  /** 金额(元) */
  amount?: number

}
/**
 * 收银台配置信息
 */
export interface CheckoutConfigResult {
  /** 收银台名称 */
  name?: string
  /** PC收银台是否同时显示聚合收银码 */
  aggregateShow?: boolean
  /** h5收银台自动升级聚合支付 */
  h5AutoUpgrade?: boolean
}

/**
 * 收银台分类配置
 */
export interface CheckoutGroupConfigResult {
  /** 主键 */
  id?: string
  /** 名称 */
  name?: string
  /** 配置项列表 */
  items?: CheckoutItemConfigResult[]
}

/**
 * 收银台配置项
 */
export interface CheckoutItemConfigResult {
  /** 主键 */
  id?: string
  /** 发起调用的类型 */
  callType?: string
  /** 名称 */
  name?: string
  /** 支付通道 */
  channel?: string
  /** 支付方式 */
  payMethod?: string
}

/**
 * 收银台聚合配置信息
 */
export interface AggregateConfigResult {
  /** 支付类型 */
  type?: string
  /** 通道 */
  channel?: string
  /** 支付方式 */
  payMethod?: string
  /** 自动拉起支付 */
  autoLaunch?: boolean
}
