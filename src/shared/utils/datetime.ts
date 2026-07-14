/**
 * 日期时间格式化工具（基于 dayjs）
 *
 * - 后端时间字段统一为 `timestamptz(6)`，返回带偏移的 ISO 8601，此处 `.local()` 转为浏览器本地时区显示
 * - 日期/日期时间统一使用 ISO 8601 年-月-日顺序（`YYYY-MM-DD`），消除各国 MM/DD vs DD/MM 歧义
 * - dayjs 全局 locale 由 `setupI18n` 的副作用函数随语言切换同步（仅影响相对时间 fromNow 的本地化文本）
 */
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/en'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/zh-hk'
import 'dayjs/locale/zh-tw'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.extend(localizedFormat)
dayjs.extend(relativeTime)

/**
 * 统一日期格式
 *
 * 采用 ISO 8601 年-月-日（`YYYY-MM-DD`），不随语言变化，
 * 以消除 US 的 `MM/DD/YYYY` 与欧洲的 `DD/MM/YYYY` 之间的歧义。
 */
const DATE_FORMAT = 'YYYY-MM-DD'

/** 统一日期时间格式 */
const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm'

/**
 * 格式化为日期（`YYYY-MM-DD`，统一格式不随语言变化）
 * @param iso ISO 8601 字符串（可带时区偏移），转浏览器本地时区显示
 */
export function formatDate(iso?: string | null): string {
  if (!iso) {
    return ''
  }
  const d = dayjs(iso).local()
  return d.isValid() ? d.format(DATE_FORMAT) : ''
}

/**
 * 格式化为日期时间（`YYYY-MM-DD HH:mm`，统一格式不随语言变化）
 * @param iso ISO 8601 字符串（可带时区偏移），转浏览器本地时区显示
 */
export function formatDateTime(iso?: string | null): string {
  if (!iso) {
    return ''
  }
  const d = dayjs(iso).local()
  return d.isValid() ? d.format(DATETIME_FORMAT) : ''
}

/**
 * 相对时间（如"3分钟前"/"3 minutes ago"），跟随 dayjs 全局 locale 本地化
 * @param iso ISO 8601 字符串（可带时区偏移），转浏览器本地时区显示
 */
export function formatRelativeTime(iso?: string | null): string {
  if (!iso) {
    return ''
  }
  const d = dayjs(iso).local()
  return d.isValid() ? d.fromNow() : ''
}
