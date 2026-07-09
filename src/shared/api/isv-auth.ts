import { RequestEnum } from '@/shared/enums/httpEnum'
import { http } from '@/shared/utils/http/axios'

/**
 * 服务商(ISV)代运营授权: 授权码换取 app_auth_token
 */
export function isvAuthCallback(param: IsvAuthParam): Promise<void> {
  return http.request<void>({
    url: '/unipay/assist/alipay/isv/auth/callback',
    method: RequestEnum.POST,
    data: param,
  }, {
    // 由页面自行处理错误展示
    isShowMessage: false,
  })
}

/** 代运营授权回调参数 */
export interface IsvAuthParam {
  /** 通道商户号 */
  channelMchNo: string
  /** 应用授权码 */
  code: string
}
