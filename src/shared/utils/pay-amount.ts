/**
 * 支付金额工具：分 ↔ 元
 */

/**
 * 支付金额上限(分)，对齐后端 NormalPayParam @Max(9999999999)
 * 即 99999999.99 元
 */
export const MAX_PAY_AMOUNT_FEN = 9_999_999_999

/**
 * 支付金额上限(元，展示/比较用)
 */
export const MAX_PAY_AMOUNT_YUAN = MAX_PAY_AMOUNT_FEN / 100

/**
 * 分 → 元字符串（两位小数）
 * 后端 Long 全局序列化为字符串（防 JS 精度），故需兼容字符串入参
 */
export function fenToYuan(amount?: number | null | string): string {
  if (amount == null) {
    return '0.00'
  }
  // Number.isFinite 不做类型转换，字符串数字会误判，先用 Number() 归一
  const n = Number(amount)
  if (!Number.isFinite(n)) {
    return '0.00'
  }
  return (n / 100).toFixed(2)
}

/**
 * 元字符串 → 分（非法或 ≤0 返回 0）
 */
export function yuanToFen(yuan: string): number {
  const n = Number(yuan)
  if (!Number.isFinite(n) || n <= 0) {
    return 0
  }
  return Math.round(n * 100)
}

/**
 * 元字符串是否超过支付上限（含中间输入态如 "100."，按数值比较）
 */
export function isAmountOverMax(yuan: string): boolean {
  const n = Number(yuan)
  if (!Number.isFinite(n)) {
    return false
  }
  // 与分精度对齐：先转分再比，避免浮点误差
  return Math.round(n * 100) > MAX_PAY_AMOUNT_FEN
}
