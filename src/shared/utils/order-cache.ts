/**
 * 网关订单数据 sessionStorage 缓存
 *
 * 用于 OAuth 跳转回跳后快速恢复订单展示，减少二次加载造成的 loading 闪烁。
 * 维度：orderNo；TTL 60s（订单状态可能变化，超时强制重拉）。
 *
 * 与 pay-openid.ts 同源设计：sessionStorage 而非 localStorage，
 * 避免跨标签页污染；关闭标签即失效。
 */

interface CachedOrder<T = unknown> {
  data: T
  expireAt: number
}

const STORAGE_PREFIX = 'daxpay:gw:order:'
const DEFAULT_TTL = 60_000

function storageKey(orderNo: string): string {
  return `${STORAGE_PREFIX}${orderNo}`
}

/**
 * 写入订单缓存
 */
export function cacheOrder<T = unknown>(orderNo: string, data: T, ttl = DEFAULT_TTL): void {
  if (!orderNo || !data) {
    return
  }
  try {
    const payload: CachedOrder<T> = { data, expireAt: Date.now() + ttl }
    sessionStorage.setItem(storageKey(orderNo), JSON.stringify(payload))
  }
  catch {
    // 隐私模式 / 配额满等忽略
  }
}

/**
 * 读取订单缓存（过期或不存在返回 undefined）
 */
export function getCachedOrder<T = unknown>(orderNo: string): T | undefined {
  if (!orderNo) {
    return undefined
  }
  try {
    const raw = sessionStorage.getItem(storageKey(orderNo))
    if (!raw) {
      return undefined
    }
    const payload = JSON.parse(raw) as CachedOrder<T>
    if (!payload?.data || !payload.expireAt || Date.now() > payload.expireAt) {
      sessionStorage.removeItem(storageKey(orderNo))
      return undefined
    }
    return payload.data
  }
  catch {
    return undefined
  }
}

/**
 * 清除订单缓存
 */
export function clearCachedOrder(orderNo: string): void {
  if (!orderNo) {
    return
  }
  try {
    sessionStorage.removeItem(storageKey(orderNo))
  }
  catch {
    // ignore
  }
}
