/**
 * 网关聚合扫码 / 收银台 API
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

/** 聚合/收银台支付结果 */
export interface AggregatePayResult {
  orderId?: string | number
  bizOrderNo?: string
  orderNo?: string
  status?: string
  payBody?: string
  payBodyType?: string
}

/** 收银台支付项(公开字段) */
export interface CashierItemPublic {
  /** 支付项ID(后端 Long, 前端用 string 避免精度问题) */
  id: string
  name?: string
  icon?: string
  recommend?: boolean
  sortNo?: number
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

/** 收银台支付项列表 */
export function listCashierItems(params: {
  orderNo: string
  cashierType: string
  clientEnv?: string
}): Promise<CashierItemPublic[]> {
  return http.request<CashierItemPublic[]>({
    url: '/client/gateway/cashier/items',
    method: RequestEnum.GET,
    params,
  }, {
    isShowMessage: false,
  }).then((list) => {
    // id 统一为 string
    return (list || []).map(item => ({
      ...item,
      id: String(item.id),
    }))
  })
}

/** 收银台发起支付 */
export function cashierPay(data: {
  orderNo: string
  itemId: string | number
  cashierType: string
  clientEnv?: string
  openId?: string
  device?: string
  clientIp?: string
}): Promise<AggregatePayResult> {
  return http.request<AggregatePayResult>({
    url: '/client/gateway/cashier/pay',
    method: RequestEnum.POST,
    data: {
      ...data,
      // 后端 Long; 字符串数字可被 Jackson 反序列化
      itemId: data.itemId,
    },
  }, {
    isShowMessage: false,
  })
}
