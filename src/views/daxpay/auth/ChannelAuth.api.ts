import { http } from '@/utils/http/axios'
import type { Result } from '#/axios'

/**
 * 通过AuthCode获取并设置认证结果
 * @param param
 */
export function authAndSet(param: AuthCodeParam) {
  return http.request<Result>({
    url: '/unipay/assist/channel/auth/authAndSet',
    method: 'POST',
    data: param,
  })
}

/**
 * 通道认证参数
 */
export interface AuthCodeParam {
  // 通道
  channel?: string
  // 标识码
  authCode?: string
  // 查询Code
  queryCode?: string
  // 应用号
  appId?: string
}

/**
 * AuthResult
 */
export interface AuthResult {
  // OpenId
  openId?: string
  // 用户ID
  userId?: string
  // AccessToken
  accessToken?: string
  // 状态
  status?: string
}
