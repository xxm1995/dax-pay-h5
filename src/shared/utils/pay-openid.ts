/**
 * 网关支付 openId 会话存储
 * key 维度: orderNo + clientEnv, 避免跨单/跨环境串用
 */

const STORAGE_PREFIX = 'daxpay:gw:openid:'

function storageKey(orderNo: string, clientEnv: string): string {
  return `${STORAGE_PREFIX}${orderNo}:${clientEnv}`
}

/**
 * 读取 openId
 */
export function getPayOpenId(orderNo: string, clientEnv: string): string {
  if (!orderNo || !clientEnv) {
    return ''
  }
  try {
    return sessionStorage.getItem(storageKey(orderNo, clientEnv)) || ''
  }
  catch {
    return ''
  }
}

/**
 * 写入 openId
 */
export function setPayOpenId(orderNo: string, clientEnv: string, openId: string): void {
  if (!orderNo || !clientEnv || !openId) {
    return
  }
  try {
    sessionStorage.setItem(storageKey(orderNo, clientEnv), openId)
  }
  catch {
    // 隐私模式等忽略
  }
}

/**
 * 清除 openId
 */
export function clearPayOpenId(orderNo: string, clientEnv: string): void {
  try {
    sessionStorage.removeItem(storageKey(orderNo, clientEnv))
  }
  catch {
    // ignore
  }
}

/**
 * 当前 clientEnv 是否通常需要 openId 才能 JSAPI
 */
export function clientEnvNeedsOpenId(clientEnv: string): boolean {
  return clientEnv === 'wechat' || clientEnv === 'alipay' || clientEnv === 'douyin'
}

/**
 * clientEnv → 后端 authType(ChannelAuthTypeEnum)
 */
export function clientEnvToAuthType(clientEnv: string): string | null {
  if (clientEnv === 'wechat' || clientEnv === 'alipay' || clientEnv === 'douyin') {
    return clientEnv
  }
  return null
}
