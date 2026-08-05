/**
 * 支付参数体类型（与后端 PayBodyTypeEnum 对齐）
 *
 * 后端枚举: link / jsapi / from / identifier / qr_code / json
 * 历史误写 url 在分发层按 link 兼容
 * Stripe 通道扩展: stripe_checkout(Checkout Session 跳转) / stripe_intent(PaymentIntent client_secret)
 */
export const PayBodyType = {
  /** 支付链接 */
  LINK: 'link',
  /** JSAPI 对象(微信/支付宝容器内调起) */
  JSAPI: 'jsapi',
  /** 表单数据(后端枚举码为 from, 历史拼写) */
  FROM: 'from',
  /** 标识码 */
  IDENTIFIER: 'identifier',
  /** 二维码内容 */
  QR_CODE: 'qr_code',
  /** JSON 对象 */
  JSON: 'json',
  /** 历史误写, 按 link 处理 */
  URL_LEGACY: 'url',
  /** Stripe Checkout Session 跳转 URL(前端直接跳转, 与 link 行为一致) */
  STRIPE_CHECKOUT: 'stripe_checkout',
  /** Stripe PaymentIntent client_secret(前端用 Stripe.js Elements 调 confirmCardPayment) */
  STRIPE_INTENT: 'stripe_intent',
} as const

export type PayBodyTypeCode = (typeof PayBodyType)[keyof typeof PayBodyType]

/**
 * 是否为跳转链接类 payBodyType
 */
export function isLinkPayBodyType(type?: string | null): boolean {
  return type === PayBodyType.LINK || type === PayBodyType.URL_LEGACY
}

/**
 * 是否为二维码类
 */
export function isQrCodePayBodyType(type?: string | null): boolean {
  return type === PayBodyType.QR_CODE
}
