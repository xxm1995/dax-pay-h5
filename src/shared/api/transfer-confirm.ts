/**
 * 微信转账确认收款 API
 *
 * C 端收款人(无登录态)凭 transferNo 查询确认收款信息。
 * 接口 GET /unipay/transfer/wechat/confirm-info/{transferNo} (@IgnoreAuth)
 */
import { RequestEnum } from '@/shared/enums/httpEnum'
import { http } from '@/shared/utils/http/axios'

/** 微信转账确认收款信息 */
export interface TransferConfirmInfo {
  /** 微信商户号(拉起 requestMerchantTransfer 用) */
  mchId?: string
  /** 商户 AppID(拉起 requestMerchantTransfer 用) */
  appId?: string
  /** 拉起确认参数 package_info */
  packageInfo?: string
  /** 转账金额(分) */
  amount?: number
  /** 转账标题 */
  title?: string
  /** 转账状态 */
  status?: string
  /** 是否已终态(不可再操作) */
  received?: boolean
}

/** 查询微信转账确认收款信息 */
export function getTransferConfirmInfo(transferNo: string): Promise<TransferConfirmInfo> {
  return http.request<TransferConfirmInfo>({
    url: `/unipay/transfer/wechat/confirm-info/${transferNo}`,
    method: RequestEnum.GET,
  }, {
    isShowMessage: false,
  })
}
