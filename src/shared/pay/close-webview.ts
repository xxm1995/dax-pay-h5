/**
 * 关闭当前 webview，回到宿主钱包
 *
 * 适用场景：聚合支付完成后无商户 returnUrl 时，关闭页面回到支付宝/微信钱包。
 * - 支付宝：AlipayJSBridge.call('closeWebview')
 * - 微信：WeixinJSBridge.call('closeWindow')
 * - 云闪付/抖音/浏览器：window.close() 兜底（多数 webview 不生效，但无副作用）
 *
 * 与 [jsapi.ts] 的桥判断模式对称：宿主桥未注入时静默降级，不抛错
 * （关闭是 fire-and-forget，不能因为关不掉页面而报错影响已完成的支付体验）。
 */
export function closeWebview(): void {
  if (typeof window === 'undefined') {
    return
  }
  const w = window as any

  // 支付宝:优先用 AlipayJSBridge
  if (w.AlipayJSBridge?.call) {
    w.AlipayJSBridge.call('closeWebview')
    return
  }

  // 微信:用 WeixinJSBridge
  if (w.WeixinJSBridge?.call) {
    w.WeixinJSBridge.call('closeWindow')
    return
  }

  // 兜底:云闪付/抖音/浏览器（多数不生效，无副作用）
  if (typeof w.close === 'function') {
    w.close()
  }
}
