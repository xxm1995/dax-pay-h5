import type { WebsiteConfig } from '@/shared/api/website-config'
import { ref } from 'vue'
import { getWebsiteConfig } from '@/shared/api/website-config'
import { useGlobSetting } from '@/shared/hooks/setting'

/** localStorage 键: 站点配置缓存 envelope */
const STORAGE_KEY = 'daxpay-website-config'

/** H5 静态默认 */
const DEFAULT_BRAND = {
  logo: '/logo.svg',
  favicon: '/logo.svg',
} as const

interface WebsiteConfigCacheEnvelope {
  hash: string
  data: WebsiteConfig
}

/** 全局站点配置(响应式) */
export const websiteConfig = ref<WebsiteConfig>({})

/** 当前已应用到 favicon 的 logo 文件 id */
let appliedLogoId: string | undefined

/** 当前本地缓存 hash */
let localHash: string | undefined

/**
 * 初始化站点配置
 *
 * 同步读缓存 apply → 异步拉远程 → hash 一致 skip
 */
export async function initWebsiteConfig() {
  const cached = readCache()
  if (cached) {
    websiteConfig.value = cached.data
    localHash = cached.hash
    applyWebsiteBranding(cached.data)
  }

  try {
    const data = await getWebsiteConfig()
    if (!data) {
      return
    }
    const remoteHash = resolveRemoteHash(data)
    if (localHash && remoteHash && remoteHash === localHash) {
      return
    }
    persistWebsiteConfig(data, remoteHash)
  }
  catch {
    // 失败保留缓存/默认, 不阻断启动
  }
}

/**
 * 强制落盘并 apply
 */
export function persistWebsiteConfig(raw: WebsiteConfig, hash?: string) {
  const data = stripContentHash(raw)
  const nextHash = hash || raw.contentHash || clientHash(data)
  websiteConfig.value = data
  localHash = nextHash
  writeCache({ hash: nextHash, data })
  applyWebsiteBranding(data)
}

/**
 * 应用品牌: favicon + document.title(有 systemName 时)
 */
export function applyWebsiteBranding(config: WebsiteConfig) {
  const apiPrefix = getApiPrefix()
  const logoId = config.logo?.trim() || ''
  applyFavicon(logoId, apiPrefix)

  const name = config.systemName?.trim()
  if (name) {
    document.title = name
  }
}

function applyFavicon(logoId: string, apiPrefix: string) {
  const link = document.getElementById('favicon') as HTMLLinkElement | null
  if (!link) {
    return
  }
  const nextId = logoId || ''
  if (nextId === (appliedLogoId ?? '')) {
    return
  }
  appliedLogoId = nextId
  link.href = nextId
    ? `${apiPrefix}/file/platform/access/${nextId}`
    : DEFAULT_BRAND.favicon
}

function getApiPrefix() {
  const { urlPrefix, apiUrl } = useGlobSetting()
  // 与其它公开文件访问一致: 优先 urlPrefix
  return urlPrefix || apiUrl || ''
}

// ---------- getters ----------

export function getSystemName() {
  return websiteConfig.value.systemName?.trim() || ''
}

/** 当前是否深色（读 html.dark，由 designSetting 同步） */
function isHtmlDark() {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
}

/**
 * 站点 logo URL
 * 深色且配置了 logoDark 时优先用暗色 logo，否则回退 logo / 默认
 */
export function getLogoUrl() {
  const darkId = websiteConfig.value.logoDark?.trim()
  const lightId = websiteConfig.value.logo?.trim()
  // 深色优先 logoDark
  const id = (isHtmlDark() && darkId) ? darkId : lightId
  if (!id) {
    return DEFAULT_BRAND.logo
  }
  return `${getApiPrefix()}/file/platform/access/${id}`
}

export function getCompanyName() {
  return websiteConfig.value.companyName?.trim() || ''
}

export function getCompanyPhone() {
  return websiteConfig.value.companyPhone?.trim() || ''
}

export function getCompanyEmail() {
  return websiteConfig.value.companyEmail?.trim() || ''
}

export function getCompanyWechat() {
  return websiteConfig.value.companyWechat?.trim() || ''
}

export function getCopyright() {
  return websiteConfig.value.copyright?.trim() || getCompanyName()
}

export function getIcpInfo() {
  return websiteConfig.value.icpInfo?.trim() || ''
}

export function getIcpLink() {
  return websiteConfig.value.icpLink?.trim() || ''
}

export function getMpsInfo() {
  return websiteConfig.value.mpsInfo?.trim() || ''
}

export function getMpsLink() {
  return websiteConfig.value.mpsLink?.trim() || ''
}

export function getPcacInfo() {
  return websiteConfig.value.pcacInfo?.trim() || ''
}

export function getPcacLink() {
  return websiteConfig.value.pcacLink?.trim() || ''
}

export function getIcpPlusInfo() {
  return websiteConfig.value.icpPlusInfo?.trim() || ''
}

export function getIcpPlusLink() {
  return websiteConfig.value.icpPlusLink?.trim() || ''
}

export function hasWebsiteFooterContent() {
  return !!(
    getCopyright()
    || getIcpInfo()
    || getMpsInfo()
    || getPcacInfo()
    || getIcpPlusInfo()
    || getCompanyPhone()
    || getCompanyEmail()
    || getCompanyWechat()
  )
}

// ---------- cache / hash ----------

function readCache(): WebsiteConfigCacheEnvelope | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw) as WebsiteConfigCacheEnvelope | WebsiteConfig
    if (
      parsed
      && typeof parsed === 'object'
      && 'data' in parsed
      && 'hash' in parsed
      && (parsed as WebsiteConfigCacheEnvelope).data
      && typeof (parsed as WebsiteConfigCacheEnvelope).hash === 'string'
    ) {
      return parsed as WebsiteConfigCacheEnvelope
    }
    return {
      hash: '',
      data: stripContentHash(parsed as WebsiteConfig),
    }
  }
  catch {
    return null
  }
}

function writeCache(envelope: WebsiteConfigCacheEnvelope) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
}

function stripContentHash(config: WebsiteConfig): WebsiteConfig {
  const { contentHash: _h, ...rest } = config
  return rest
}

function resolveRemoteHash(data: WebsiteConfig): string {
  if (data.contentHash) {
    return data.contentHash
  }
  return clientHash(stripContentHash(data))
}

function clientHash(data: WebsiteConfig): string {
  const keys = Object.keys(data).sort() as (keyof WebsiteConfig)[]
  const normalized: Record<string, unknown> = {}
  for (const key of keys) {
    if (key === 'contentHash') {
      continue
    }
    const value = data[key]
    if (value !== undefined && value !== null && value !== '') {
      normalized[key] = value
    }
  }
  const str = JSON.stringify(normalized)
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return (hash >>> 0).toString(16)
}
