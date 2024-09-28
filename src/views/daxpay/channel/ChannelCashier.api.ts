import { http } from '@/utils/http/axios'
import type { Result } from '#/axios'

/**
 * 通道认证参数
 */
export interface CashierAuthCodeParam {
  // 标识码
  authCode?: string
  // 查询Code
  queryCode?: string
  // 商户号
  mchNo?: string
  // 应用号
  appId?: string
  // 收银台类型
  cashierType?: string
}
