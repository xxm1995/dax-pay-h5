/**
 * 支付结果分发（按 payBodyType）
 *
 * 与后端 PayBodyTypeEnum 对齐；兼容历史 payBodyType=url
 */
import { isLinkPayBodyType, isQrCodePayBodyType, PayBodyType } from '@/shared/enums/pay-body-type'

/** 最小支付结果字段（收银台 / 聚合 / 码牌共用） */
export interface PayResultLike {
  status?: string
  payBody?: string
  payBodyType?: string
}

/** handlePayResult 动作类型 */
export type PayResultAction
  = | { type: 'success' }
    | { type: 'redirect', url: string }
    | { type: 'qrcode', content: string }
    | { type: 'form', html: string }
    | { type: 'jsapi', payload: string }
    | { type: 'poll' }
    | { type: 'unsupported', payBodyType?: string, payBody?: string }

export interface HandlePayResultOptions {
  /** 是否用 location.replace 跳转链接（默认 href） */
  replace?: boolean
}

/**
 * 解析支付接口返回，得到前端应执行的动作
 * 不直接操作 DOM/路由，由调用方根据 action 处理
 */
export function resolvePayResult(
  result?: PayResultLike | null,
  _options?: HandlePayResultOptions,
): PayResultAction {
  if (!result) {
    return { type: 'poll' }
  }

  // 同步成功
  if (result.status === 'success') {
    return { type: 'success' }
  }

  const body = result.payBody
  const bodyType = result.payBodyType

  if (body && isLinkPayBodyType(bodyType)) {
    return { type: 'redirect', url: body }
  }

  if (body && isQrCodePayBodyType(bodyType)) {
    return { type: 'qrcode', content: body }
  }

  if (body && bodyType === PayBodyType.FROM) {
    return { type: 'form', html: body }
  }

  if (body && bodyType === PayBodyType.JSAPI) {
    return { type: 'jsapi', payload: body }
  }

  // json / identifier / 未知：有 body 时先轮询并交给上层展示；无 body 纯轮询
  if (body && (bodyType === PayBodyType.JSON || bodyType === PayBodyType.IDENTIFIER)) {
    return { type: 'unsupported', payBodyType: bodyType, payBody: body }
  }

  if (body && bodyType) {
    return { type: 'unsupported', payBodyType: bodyType, payBody: body }
  }

  return { type: 'poll' }
}

/**
 * 执行跳转链接
 */
export function redirectToPayUrl(url: string, replace = false): void {
  if (replace) {
    window.location.replace(url)
  }
  else {
    window.location.href = url
  }
}

/**
 * 将通道返回的 form HTML 写入并自动提交
 */
export function submitPayForm(html: string): void {
  const wrapper = document.createElement('div')
  wrapper.style.display = 'none'
  wrapper.innerHTML = html
  document.body.appendChild(wrapper)
  const form = wrapper.querySelector('form')
  if (form) {
    form.submit()
  }
  else {
    // 非标准 form 片段时尝试整段作为可点击内容（兜底）
    document.body.appendChild(wrapper)
  }
}
