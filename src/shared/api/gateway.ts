/**
 * 网关聚合扫码 API
 */
import { RequestEnum } from '@/shared/enums/httpEnum'
import { http } from '@/shared/utils/http/axios'

/** 网关订单摘要 */
export interface GatewayOrderInfo {
  orderNo?: string
  bizOrderNo?: string
  gatewayType?: string
  title?: string
  description?: string
  amount?: number
  currency?: string
  status?: string
  expiredTime?: string
  payTime?: string
  channel?: string
  method?: string
  product?: string
  tradeNo?: string
  outOrderNo?: string
  fundStatus?: string
  attach?: string
  returnUrl?: string
}

/** 聚合支付结果 */
export interface AggregatePayResult {
  orderId?: string | number
  bizOrderNo?: string
  orderNo?: string
  status?: string
  payBody?: string
  payBodyType?: string
}

/** 查询网关订单 */
export function getGatewayOrder(orderNo: string): Promise<GatewayOrderInfo> {
  return http.request<GatewayOrderInfo>({
    url: '/client/gateway/order',
    method: RequestEnum.GET,
    params: { orderNo },
  }, {
    isShowMessage: false,
  })
}

/** 聚合扫码发起支付 */
export function aggregatePay(data: {
  orderNo: string
  clientEnv: string
  openId?: string
  device?: string
  clientIp?: string
}): Promise<AggregatePayResult> {
  return http.request<AggregatePayResult>({
    url: '/client/gateway/aggregate/pay',
    method: RequestEnum.POST,
    data,
  }, {
    isShowMessage: false,
  })
}
