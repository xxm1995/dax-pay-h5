/**
 * 动态加载外部 script, 带同 URL 并发去重缓存
 */

/** 已加载 / 加载中的 script Promise 缓存(同 URL 只注入一次) */
const scriptPromiseCache = new Map<string, Promise<void>>()

/**
 * 动态注入 script 标签到 document.head
 * 同一 url 并发调用会复用同一个 Promise, 避免重复注入
 *
 * @param url script 完整 URL
 * @param attrs 额外属性(如 crossorigin / id)
 */
export function loadScript(
  url: string,
  attrs: Record<string, string> = {},
): Promise<void> {
  const cached = scriptPromiseCache.get(url)
  if (cached) {
    return cached
  }
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = url
    script.async = true
    Object.entries(attrs).forEach(([k, v]) => {
      script.setAttribute(k, v)
    })
    script.onload = () => resolve()
    script.onerror = () => {
      // 加载失败要从缓存移除, 允许重试
      scriptPromiseCache.delete(url)
      reject(new Error(`Failed to load script: ${url}`))
    }
    document.head.appendChild(script)
  })
  scriptPromiseCache.set(url, promise)
  return promise
}
