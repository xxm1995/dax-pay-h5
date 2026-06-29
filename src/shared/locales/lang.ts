/**
 * 语言选项与浏览器探测
 *
 * 语言代码与后端 common-i18n 对齐：仅支持 zh-CN / en-US。
 */

/** 应用支持的语言代码（与后端 common-i18n 一致） */
export type AppLocaleCode = 'zh-CN' | 'en-US'

export interface AppLocaleOption {
  /** 语言代码 */
  code: AppLocaleCode
  /** `<html lang>` 属性值 */
  htmlLang: string
  /** dayjs locale 名称 */
  dayjsLocale: string
  /** vant 语言包动态导入函数 */
  vantLoader: () => Promise<{ default: Record<string, any> }>
}

/** 全部支持的语言选项 */
export const APP_LOCALES: AppLocaleOption[] = [
  {
    code: 'zh-CN',
    htmlLang: 'zh-cmn-Hans',
    dayjsLocale: 'zh-cn',
    vantLoader: () => import('vant/es/locale/lang/zh-CN.mjs'),
  },
  {
    code: 'en-US',
    htmlLang: 'en',
    dayjsLocale: 'en',
    vantLoader: () => import('vant/es/locale/lang/en-US.mjs'),
  },
]

/** 默认语言 */
export const DEFAULT_LOCALE: AppLocaleCode = 'zh-CN'

/**
 * localStorage 持久化键
 *
 * 带 `-v2` 后缀：旧版本会在自动探测时落盘，导致陈旧值锁定语言、
 * 切换浏览器语言不再生效。新版仅由显式 `setLocale` 写入，
 * 加版本后缀可让历史陈旧的 `APP-LOCALE` 值自动作废，无需手动清理。
 */
export const LOCALE_STORAGE_KEY = 'APP-LOCALE-v2'

const LOCALE_MAP = new Map<string, AppLocaleOption>(APP_LOCALES.map(l => [l.code, l]))

/** 根据语言代码获取选项 */
export function getLocaleOption(code: string): AppLocaleOption | undefined {
  return LOCALE_MAP.get(code)
}

/**
 * 从浏览器 navigator.language 匹配已支持的语言
 * - 任意中文变体（zh / zh-CN / zh-TW / zh-HK）→ zh-CN
 * - 任意英文变体（en / en-US / en-GB）→ en-US
 * - 其余回退到默认语言
 */
export function matchBrowserLocale(): AppLocaleCode {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LOCALE
  }
  const langs = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const lang of langs) {
    if (!lang) {
      continue
    }
    const lower = lang.toLowerCase()
    if (lower.startsWith('zh')) {
      return 'zh-CN'
    }
    if (lower.startsWith('en')) {
      return 'en-US'
    }
  }
  return DEFAULT_LOCALE
}

/**
 * 解析初始语言，优先级：localStorage > 浏览器语言 > 默认
 */
export function resolveInitialLocale(): AppLocaleCode {
  if (typeof localStorage === 'undefined') {
    return matchBrowserLocale()
  }
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (saved && getLocaleOption(saved)) {
    return saved as AppLocaleCode
  }
  return matchBrowserLocale()
}
