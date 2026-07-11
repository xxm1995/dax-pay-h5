import { RequestEnum } from '@/shared/enums/httpEnum'
import { http } from '@/shared/utils/http/axios'

/**
 * 码牌金额类型
 */
export type AmountType = 'random' | 'fixed'

/**
 * 码牌支付信息(公开接口返回)
 */
export interface CodePayInfo {
  /** 码牌编码 */
  code?: string
  /** 码牌名称 */
  name?: string
  /** 金额类型 random-自定义 / fixed-固定 */
  amountType?: AmountType
  /** 固定金额(分, amountType=fixed 时返回) */
  fixedAmount?: number
}

/**
 * 根据码牌编码查询支付信息(公开接口, 无需登录)
 */
export function getCodePayInfo(code: string): Promise<CodePayInfo> {
  return http.request<CodePayInfo>({
    url: '/client/device/qrcode/get-by-code',
    method: RequestEnum.GET,
    params: { code },
  }, {
    // 由页面自行处理错误展示
    isShowMessage: false,
  })
}
