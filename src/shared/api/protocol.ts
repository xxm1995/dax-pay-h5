import type { UserProtocolContentResult } from './types'
import { RequestEnum } from '@/shared/enums/httpEnum'
import { getCurrentLocale } from '@/shared/locales'
import { http } from '@/shared/utils/http/axios'

// H5 应用统一归 Web 端(后端端类型枚举: WEB/APP/MINIAPP)
export const PROTOCOL_CLIENT_TYPE = 'WEB'

// 协议类型: URL 友好值(小写 kebab)
export const ProtocolType = {
  // 用户协议
  USER_AGREEMENT: 'user-agreement',
  // 隐私政策
  PRIVACY_POLICY: 'privacy-policy',
} as const

// URL 小写值 -> 后端枚举 code 映射
const PROTOCOL_TYPE_MAP: Record<string, string> = {
  [ProtocolType.USER_AGREEMENT]: 'USER_AGREEMENT',
  [ProtocolType.PRIVACY_POLICY]: 'PRIVACY_POLICY',
}

/**
 * 将路由中的 protocolType 解析为后端枚举 code
 * @param protocolType URL 段(如 user-agreement)
 * @returns 后端 code(如 USER_AGREEMENT), 非法返回 null
 */
export function resolveProtocolCode(protocolType: string): string | null {
  return PROTOCOL_TYPE_MAP[protocolType] ?? null
}

/**
 * 查询默认协议内容(对外公开接口, @IgnoreAuth 免登录)
 * @param type 协议类型 code
 * @param clientType 端类型, 默认 WEB
 * @param language 语言, 默认跟随当前 i18n locale (zh-CN / en-US)
 */
export function findDefaultProtocol(
  type: string,
  clientType: string = PROTOCOL_CLIENT_TYPE,
  language: string = getCurrentLocale(),
): Promise<UserProtocolContentResult> {
  return http.request<UserProtocolContentResult>({
    url: '/user/protocol/find-default',
    method: RequestEnum.GET,
    params: { type, clientType, language },
  }, {
    // 静默拉取, 不弹全局提示
    isShowMessage: false,
  })
}
