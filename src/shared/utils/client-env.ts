/**
 * 客户端环境探测与路由辅助
 * 与后端 ClientEnvEnum 对齐: browser / wechat / alipay / union_pay / douyin
 */

/** H5 收银台允许的 clientEnv */
export const H5_CLIENT_ENVS = [
  'browser',
  'wechat',
  'alipay',
  'union_pay',
  'douyin',
] as const

export type H5ClientEnv = (typeof H5_CLIENT_ENVS)[number]

/** 兼容旧别名 */
export type ClientEnv = H5ClientEnv

/** 聚合扫码支持的宿主环境（不含 browser） */
export const AGGREGATE_CLIENT_ENVS = [
  'wechat',
  'alipay',
  'union_pay',
  'douyin',
] as const

export type AggregateClientEnv = (typeof AGGREGATE_CLIENT_ENVS)[number]

/**
 * 根据 UA 识别客户端环境
 */
export function detectClientEnv(
  ua = typeof navigator !== 'undefined' ? navigator.userAgent : '',
): H5ClientEnv {
  const lower = ua.toLowerCase()
  if (lower.includes('micromessenger')) {
    return 'wechat'
  }
  if (lower.includes('alipayclient') || lower.includes('alipay')) {
    return 'alipay'
  }
  if (lower.includes('unionpay') || lower.includes('cloudpay') || lower.includes('upwallet')) {
    return 'union_pay'
  }
  if (lower.includes('aweme') || lower.includes('toutiao') || lower.includes('douyin')) {
    return 'douyin'
  }
  return 'browser'
}

/**
 * 是否合法的 H5 clientEnv
 */
export function isValidH5ClientEnv(value: unknown): value is H5ClientEnv {
  return typeof value === 'string' && (H5_CLIENT_ENVS as readonly string[]).includes(value)
}

/**
 * 是否聚合支持的宿主环境
 */
export function isAggregateClientEnv(value: unknown): value is AggregateClientEnv {
  return typeof value === 'string' && (AGGREGATE_CLIENT_ENVS as readonly string[]).includes(value)
}

/**
 * UA → 聚合 clientEnv；非宿主返回 null（禁止默认 wechat）
 */
export function detectAggregateClientEnv(
  ua = typeof navigator !== 'undefined' ? navigator.userAgent : '',
): AggregateClientEnv | null {
  const env = detectClientEnv(ua)
  return isAggregateClientEnv(env) ? env : null
}

/**
 * 构建收银台环境页 path（不含 base）
 */
export function buildCashierEnvPath(orderNo: string, clientEnv: H5ClientEnv): string {
  return `/cashier/${encodeURIComponent(orderNo)}/${clientEnv}`
}

/**
 * 构建聚合环境页 path（与 RoutePath 一致）
 * union_pay → /aggregate/union-pay/:orderNo
 */
export function buildAggregateEnvPath(orderNo: string, clientEnv: AggregateClientEnv): string {
  const segment = clientEnv === 'union_pay' ? 'union-pay' : clientEnv
  return `/aggregate/${segment}/${encodeURIComponent(orderNo)}`
}

/** OAuth 回跳后 openId 暂存 key */
export function aggregateOpenIdStorageKey(orderNo: string): string {
  return `aggregate:openId:${orderNo}`
}

/**
 * 读取 sessionStorage 中的 openId
 */
export function readAggregateOpenId(orderNo: string, clear = false): string {
  if (typeof sessionStorage === 'undefined' || !orderNo) {
    return ''
  }
  const key = aggregateOpenIdStorageKey(orderNo)
  const value = sessionStorage.getItem(key) || ''
  if (clear && value) {
    sessionStorage.removeItem(key)
  }
  return value
}

/**
 * 写入 openId（授权页回跳前）
 */
export function writeAggregateOpenId(orderNo: string, openId: string): void {
  if (typeof sessionStorage === 'undefined' || !orderNo || !openId) {
    return
  }
  sessionStorage.setItem(aggregateOpenIdStorageKey(orderNo), openId)
}

/**
 * 从 returnPath 解析 orderNo
 * 支持 /aggregate/wechat/{orderNo} 与 /cashier/{orderNo}/wechat
 */
export function parseOrderNoFromReturnPath(returnPath?: string | null): string {
  if (!returnPath) {
    return ''
  }
  const path = returnPath.split('?')[0] || ''
  const agg = path.match(/^\/aggregate\/(?:wechat|alipay|union-pay|douyin)\/([^/]+)/)
  if (agg?.[1]) {
    return decodeURIComponent(agg[1])
  }
  const cashier = path.match(/^\/cashier\/([^/]+)\//)
  if (cashier?.[1]) {
    return decodeURIComponent(cashier[1])
  }
  return ''
}
