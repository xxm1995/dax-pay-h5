/**
 * Stripe 国际卡支付（PaymentIntent + Elements 模式）
 *
 * 项目不引入 @stripe/stripe-js npm 包：运行时动态加载 https://js.stripe.com/v3/，
 * 以 Card Element 收集卡信息，调 confirmCardPayment 完成支付（3DS 由 Stripe.js 自动处理）。
 * 与后端 stripe_intent 支付参数体类型对应（Checkout Session 跳转走 stripe_checkout/link 分支）。
 */

import { loadScript } from '@/shared/utils/load-script'

/** Stripe.js 官方 CDN 地址 */
const STRIPE_JS_URL = 'https://js.stripe.com/v3/'

/** Stripe Card Element（最小化声明，仅用到的成员） */
export interface StripeJsCardElement {
  mount: (el: HTMLElement | string) => void
  unmount: () => void
  destroy: () => void
  on: (event: 'change', handler: (event: StripeJsCardChangeEvent) => void) => void
}

/** Card Element change 事件负载 */
export interface StripeJsCardChangeEvent {
  /** 卡信息是否完整（可提交支付） */
  complete?: boolean
  /** 输入错误（卡号/有效期/CVC 校验失败） */
  error?: { message?: string, type?: string } | null
}

/** confirmCardPayment 错误（卡被拒/3DS 未完成等） */
export interface StripeJsConfirmError {
  message?: string
  code?: string
  decline_code?: string
  type?: string
}

/** confirmCardPayment 结果 */
export interface StripeJsConfirmResult {
  paymentIntent?: { id?: string, status?: string }
  error?: StripeJsConfirmError
}

/** Stripe Elements 实例（仅声明 card 元素创建） */
export interface StripeJsElements {
  create: (type: 'card', options?: Record<string, unknown>) => StripeJsCardElement
}

/** Stripe 客户端（最小化声明） */
export interface StripeJsClient {
  elements: (options?: { locale?: string }) => StripeJsElements
  confirmCardPayment: (
    clientSecret: string,
    options?: {
      payment_method?: { card: StripeJsCardElement }
      return_url?: string
    },
  ) => Promise<StripeJsConfirmResult>
}

/** js.stripe.com/v3 注入的全局构造函数 */
type StripeJsGlobal = (publishableKey: string) => StripeJsClient

/** 已加载的 Stripe.js 全局对象（单例） */
let stripeJsPromise: Promise<StripeJsGlobal> | null = null

/**
 * 动态加载 Stripe.js（全局只加载一次；失败清除缓存允许重试）
 */
export function loadStripeJs(): Promise<StripeJsGlobal> {
  if (stripeJsPromise) {
    return stripeJsPromise
  }
  stripeJsPromise = loadScript(STRIPE_JS_URL)
    .then(() => {
      const Stripe = (window as unknown as { Stripe?: StripeJsGlobal }).Stripe
      if (!Stripe) {
        // 脚本加载成功但全局对象缺失，按失败处理
        throw new Error('Stripe.js global not found')
      }
      return Stripe
    })
    .catch((err) => {
      // 失败后允许下次重新加载
      stripeJsPromise = null
      throw err
    })
  return stripeJsPromise
}

/** stripe_intent 参数体（后端 payBody JSON 字段） */
export interface StripeIntentPayload {
  /** PaymentIntent client_secret（pi_xxx_secret_xxx） */
  clientSecret: string
  /** Stripe publishableKey（pk_xxx），用于初始化 Stripe.js */
  publishableKey: string
  /** 3DS 认证完成后的回跳地址（可选） */
  returnUrl?: string
}

/**
 * 解析 stripe_intent 的 payBody
 *
 * 优先按 JSON 解析（clientSecret / publishableKey / returnUrl）；
 * 兼容后端直接返回纯 client_secret 字符串的场景（此时缺 publishableKey 由上层提示）。
 */
export function parseStripeIntentPayload(payBody: string): StripeIntentPayload | null {
  if (!payBody) {
    return null
  }
  let json: unknown = null
  try {
    json = JSON.parse(payBody)
  }
  catch {
    // 非 JSON：视为纯 client_secret 字符串
    return { clientSecret: payBody, publishableKey: '' }
  }
  if (json && typeof json === 'object') {
    const data = json as Record<string, unknown>
    return {
      clientSecret: String(data.clientSecret ?? data.client_secret ?? ''),
      publishableKey: String(data.publishableKey ?? data.publishable_key ?? ''),
      returnUrl: typeof data.returnUrl === 'string' && data.returnUrl ? data.returnUrl : undefined,
    }
  }
  // JSON 标量（如带引号的字符串字面量）：按纯 client_secret 处理
  return { clientSecret: payBody, publishableKey: '' }
}

/** BCP47 语言码 → Stripe Elements locale */
const STRIPE_LOCALE_MAP: Record<string, string> = {
  'zh-CN': 'zh',
  'zh-TW': 'zh-Hant',
  'zh-HK': 'zh-Hant',
  'en-US': 'en',
  'ja-JP': 'ja',
  'ko-KR': 'ko',
  'id-ID': 'id',
  'vi-VN': 'vi',
  'th-TH': 'th',
  'ms-MY': 'ms',
}

/**
 * 当前界面语言转 Stripe locale（未命中返回 undefined，由 Stripe 按浏览器语言自动）
 */
export function toStripeLocale(locale?: string): string | undefined {
  if (!locale) {
    return undefined
  }
  return STRIPE_LOCALE_MAP[locale.replace('_', '-')]
}

/**
 * 初始化 Stripe 客户端（publishableKey 必填，页面语言在 elements() 时传入）
 */
export function createStripeClient(publishableKey: string): Promise<StripeJsClient> {
  return loadStripeJs().then(Stripe => Stripe(publishableKey))
}

/** 确认支付结果 */
export type ConfirmStripePaymentResult
  = | { ok: true, status: 'succeeded' }
    | { ok: true, status: 'pending' }
    | { ok: false, message: string }

/**
 * 提交卡信息确认支付
 *
 * - succeeded：Stripe 已确认扣款成功
 * - pending：已受理但未终态（processing / 3DS 处理中），由上层轮询订单兜底
 * - ok=false：支付被拒/参数错误，message 为 Stripe 已按 locale 本地化的错误文案
 */
export async function confirmStripePayment(
  client: StripeJsClient,
  clientSecret: string,
  cardElement: StripeJsCardElement,
  returnUrl?: string,
): Promise<ConfirmStripePaymentResult> {
  let result: StripeJsConfirmResult
  try {
    result = await client.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
      ...(returnUrl ? { return_url: returnUrl } : {}),
    })
  }
  catch (e: any) {
    // Stripe.js 内部异常（网络/SDK），非卡信息错误
    return { ok: false, message: e?.message || 'stripe confirm failed' }
  }
  if (result.error) {
    // 卡被拒 / 3DS 未完成等，message 已按 locale 本地化
    return { ok: false, message: result.error.message || 'stripe confirm failed' }
  }
  const status = result.paymentIntent?.status
  if (status === 'succeeded') {
    return { ok: true, status: 'succeeded' }
  }
  // processing / requires_action 等：已受理，等待最终结果
  return { ok: true, status: 'pending' }
}
