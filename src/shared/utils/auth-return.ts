/**
 * 通道 OAuth 完成后：落盘 openId 并回跳业务页
 */
import type { AuthResult } from '@/shared/api/channel-auth'
import { setPayOpenId } from '@/shared/utils/pay-openid'

/**
 * 从 returnPath 解析收银台环境
 * 例: /cashier/ORD123/wechat → { orderNo, clientEnv }
 */
export function parseCashierReturnPath(returnPath: string): { orderNo: string, clientEnv: string } | null {
  if (!returnPath) {
    return null
  }
  const pathOnly = returnPath.split('?')[0]
  const parts = pathOnly.split('/').filter(Boolean)
  // cashier / {orderNo} / {clientEnv}
  if (parts[0] === 'cashier' && parts.length >= 3) {
    return { orderNo: parts[1], clientEnv: parts[2] }
  }
  return null
}

/**
 * 从 returnPath 解析聚合环境
 * 例: /aggregate/wechat/ORD123 → { orderNo, clientEnv }
 *     /aggregate/union-pay/ORD123 → union_pay
 */
export function parseAggregateReturnPath(returnPath: string): { orderNo: string, clientEnv: string } | null {
  if (!returnPath) {
    return null
  }
  const pathOnly = returnPath.split('?')[0]
  const parts = pathOnly.split('/').filter(Boolean)
  // aggregate / {envSegment} / {orderNo}
  if (parts[0] !== 'aggregate' || parts.length < 3) {
    return null
  }
  const segment = parts[1]
  const orderNo = parts[2]
  if (!orderNo || segment === 'unsupported') {
    return null
  }
  const clientEnv = segment === 'union-pay' ? 'union_pay' : segment
  if (!['wechat', 'alipay', 'union_pay', 'douyin'].includes(clientEnv)) {
    return null
  }
  return { orderNo, clientEnv }
}

/**
 * 从 returnPath 解析码牌分端页
 * 例: /h/wechat/ABC001?authed=1 → { code, clientEnv }
 *     /h/alipay/ABC001 → alipay
 */
export function parseCodePayReturnPath(returnPath: string): { code: string, clientEnv: string } | null {
  if (!returnPath) {
    return null
  }
  const pathOnly = returnPath.split('?')[0]
  const parts = pathOnly.split('/').filter(Boolean)
  // h / {envSegment} / {code}
  if (parts[0] !== 'h' || parts.length < 3) {
    return null
  }
  const segment = parts[1]
  const code = parts[2]
  if (!code || segment === 'unsupported') {
    return null
  }
  const clientEnv = segment === 'union-pay' ? 'union_pay' : segment
  if (!['wechat', 'alipay', 'union_pay', 'douyin'].includes(clientEnv)) {
    return null
  }
  return { code, clientEnv }
}

/**
 * 授权成功后的统一收尾
 * @returns true 表示已跳转业务页, 调用方勿再展示成功页
 */
export function finishGatewayAuthAndRedirect(result: AuthResult): boolean {
  const openId = result.openId || result.userId || ''
  const returnPath = result.returnPath
  if (!openId || !returnPath) {
    return false
  }
  // 仅允许站内相对路径
  if (!returnPath.startsWith('/') || returnPath.startsWith('//') || returnPath.includes('://')) {
    return false
  }
  const cashier = parseCashierReturnPath(returnPath)
  if (cashier) {
    setPayOpenId(cashier.orderNo, cashier.clientEnv, openId)
  }
  const aggregate = parseAggregateReturnPath(returnPath)
  if (aggregate) {
    setPayOpenId(aggregate.orderNo, aggregate.clientEnv, openId)
  }
  // 码牌: 以 code 作为 openId 存储主键(复用 pay-openid 工具)
  const codePay = parseCodePayReturnPath(returnPath)
  if (codePay) {
    setPayOpenId(codePay.code, codePay.clientEnv, openId)
  }
  // replace 避免返回键回到授权中转页
  window.location.replace(returnPath)
  return true
}
