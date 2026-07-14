import { RequestEnum } from '@/shared/enums/httpEnum'
import { http } from '@/shared/utils/http/axios'

/**
 * 平台站点显示内容配置
 */
export interface WebsiteConfig {
  systemName?: string
  companyName?: string
  companyPhone?: string
  companyEmail?: string
  companyWechat?: string
  logo?: string
  logoDark?: string
  icpInfo?: string
  icpLink?: string
  mpsInfo?: string
  mpsLink?: string
  pcacInfo?: string
  pcacLink?: string
  icpPlusInfo?: string
  icpPlusLink?: string
  copyright?: string
  /** 配置内容哈希(只读, 供客户端缓存比对) */
  contentHash?: string
}

/**
 * 获取站点配置(免登录)
 */
export function getWebsiteConfig(): Promise<WebsiteConfig> {
  return http.request<WebsiteConfig>({
    url: '/platform/config/website/get',
    method: RequestEnum.GET,
  }, {
    // 静默拉取, 不弹全局提示
    isShowMessage: false,
  })
}
