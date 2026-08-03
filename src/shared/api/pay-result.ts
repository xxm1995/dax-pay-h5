/**
 * 支付结果查询 API
 *
 * 平台 H5 结果页调用, 无商户签名。接口 GET /unipay/gateway/pay-result?tradeNo=
 * 通道同步回跳(支付宝 return_url)与 jsapi 前端轮询两条路径共用。
 */
import { RequestEnum } from '@/shared/enums/httpEnum'
import { http } from '@/shared/utils/http/axios'

/** 支付结果查询返回 */
export interface PayResultInfo {
  /** 资金交易号 */
  tradeNo?: string
  /** 平台业务单号 */
  orderNo?: string
  /** 商户业务单号 */
  bizOrderNo?: string
  /** 订单状态(wait_pay/paying/paid/failed/closed/expired) */
  status?: string
  /** 订单标题 */
  title?: string
  /** 订单金额(分) */
  amount?: number
  /** 币种 */
  currency?: string
  /** 商户同步跳转地址 */
  returnUrl?: string
  /** 支付渠道(供前端品牌色) */
  provider?: string
  /** 是否终态(paid/failed/closed/expired) */
  finalState?: boolean
  /** 带签名的跳转地址(仅支付成功 paid + 有 returnUrl 时返回, 含平台签名) */
  redirectUrl?: string
}

/** 查询支付结果 */
export function getPayResult(tradeNo: string): Promise<PayResultInfo> {
  return http.request<PayResultInfo>({
    url: '/unipay/gateway/pay-result',
    method: RequestEnum.GET,
    params: { tradeNo },
  }, {
    isShowMessage: false,
  })
}
