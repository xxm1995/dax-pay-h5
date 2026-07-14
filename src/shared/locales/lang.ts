/**
 * 语言选项与浏览器探测
 *
 * 语言代码与后端 common-i18n 对齐：zh-CN / en-US / zh-TW / zh-HK
 */

/** 应用支持的语言代码（与后端 common-i18n 一致） */
export type AppLocaleCode = 'zh-CN' | 'en-US' | 'zh-TW' | 'zh-HK'

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
  {
    code: 'zh-TW',
    htmlLang: 'zh-Hant-TW',
    dayjsLocale: 'zh-tw',
    vantLoader: () => import('vant/es/locale/lang/zh-TW.mjs'),
  },
  {
    code: 'zh-HK',
    htmlLang: 'zh-Hant-HK',
    dayjsLocale: 'zh-hk',
    vantLoader: () => import('vant/es/locale/lang/zh-HK.mjs'),
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
 * - zh-TW / zh-Hant-TW → zh-TW
 * - zh-HK / zh-MO / zh-Hant-HK / zh-Hant-MO → zh-HK
 * - zh-Hant（无地区）→ zh-TW
 * - 其他中文（含 zh-CN / zh-Hans）→ zh-CN
 * - 英文变体 → en-US
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
    const lower = lang.toLowerCase().replace(/_/g, '-')
    if (lower.startsWith('en')) {
      return 'en-US'
    }
    if (!lower.startsWith('zh')) {
      continue
    }
    // 台湾
    if (lower.includes('tw') || lower === 'zh-hant-tw') {
      return 'zh-TW'
    }
    // 香港 / 澳门 → 港包
    if (lower.includes('hk') || lower.includes('mo')) {
      return 'zh-HK'
    }
    // 无地区繁体 → 台湾
    if (lower === 'zh-hant' || lower.startsWith('zh-hant-')) {
      return 'zh-TW'
    }
    // 简体及其他中文
    return 'zh-CN'
  }
  return DEFAULT_LOCALE
}

/**
 * 解析初始语言：localStorage 显式选择 > 浏览器探测 > 默认
 */
export function resolveInitialLocale(): AppLocaleCode {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored && getLocaleOption(stored)) {
      return stored as AppLocaleCode
    }
  }
  return matchBrowserLocale()
}
