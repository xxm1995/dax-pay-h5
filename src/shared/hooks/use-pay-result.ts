/**
 * 支付结果查询与跳转
 *
 * 供 pay-result 页(mobile/pc)共用: 查询订单状态 → 非终态轮询 → 终态展示 → 跳商户 returnUrl。
 * 两条入口路径共用本 hook:
 *  - 通道同步回跳(支付宝 return_url → /pay-result/{tradeNo}): 到达即触发查询
 *  - jsapi 终态(收银台/聚合页 router.replace 过来): 同样查询 + 跳转
 *
 * 跳转地址(redirectUrl)由后端用平台私钥签名, 前端直接 location.href, 不参与参数拼接/签名。
 */
import type { PayResultInfo } from '@/shared/api/pay-result'
import { onUnmounted, ref } from 'vue'
import { getPayResult } from '@/shared/api/pay-result'

/** 支付结果展示状态 */
export type PayResultState = 'loading' | 'paid' | 'failed' | 'closed' | 'expired' | 'loadError'

export interface UsePayResultOptions {
  /** 轮询间隔 ms, 默认 2000 */
  intervalMs?: number
  /** 最大轮询次数, 默认 90(约 3 分钟) */
  maxAttempts?: number
  /** 跳转倒计时秒数(有 redirectUrl 时), 默认 3 */
  countdownSeconds?: number
}

export function usePayResult(tradeNo: string, options: UsePayResultOptions = {}) {
  const { intervalMs = 2000, maxAttempts = 90, countdownSeconds = 3 } = options

  // 查询返回的订单信息
  const result = ref<PayResultInfo>({})
  // 当前展示状态
  const state = ref<PayResultState>('loading')
  // 加载失败时的动态消息
  const errorMessage = ref('')
  // 跳转倒计时(>0 时前端展示)
  const redirectCountdown = ref(0)
  // 是否为重入(同会话内已跳转过): sessionStorage 标记防同会话刷新/回退重复自动跳转
  const isReentry = ref(false)
  // sessionStorage key: 标记本次 tradeNo 已跳转商户, 防同会话刷新/回退/重访重复自动跳转
  const redirectedKey = `payResultRedirected_${tradeNo}`

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let countdownTimer: ReturnType<typeof setInterval> | null = null
  let attempts = 0

  function stopPoll() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  function stopCountdown() {
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
  }

  /** 由订单 status 派生展示状态(仅终态时调用) */
  function deriveState(info: PayResultInfo): PayResultState {
    switch (info.status) {
      case 'paid': return 'paid'
      case 'failed': return 'failed'
      case 'closed': return 'closed'
      case 'expired': return 'expired'
      default: return 'loadError'
    }
  }

  /** 标记本次 tradeNo 已跳转商户(防同会话刷新/回退重复自动跳转) */
  function markRedirected() {
    try {
      sessionStorage.setItem(redirectedKey, '1')
    }
    catch {
      // sessionStorage 不可用(隐私模式等)忽略, 不阻断跳转
    }
  }

  /** 启动跳转倒计时(仅 paid + 有 redirectUrl + 非重入态) */
  function startRedirectCountdown(url: string) {
    stopCountdown()
    redirectCountdown.value = countdownSeconds
    countdownTimer = setInterval(() => {
      redirectCountdown.value--
      if (redirectCountdown.value <= 0) {
        stopCountdown()
        markRedirected()
        window.location.href = url
      }
    }, 1000)
  }

  /** 应用查询结果, 终态时按需启动倒计时 */
  function applyResult(info: PayResultInfo) {
    result.value = info
    if (info.finalState) {
      state.value = deriveState(info)
      // 仅支付成功 + 有签名跳转地址 + 非重入态时启动倒计时; 重入态展示结果结束页不跳转
      if (state.value === 'paid' && info.redirectUrl && !isReentry.value) {
        startRedirectCountdown(info.redirectUrl)
      }
    }
  }

  /** 查询一次 */
  async function fetchOnce(): Promise<PayResultInfo | null> {
    try {
      const info = await getPayResult(tradeNo)
      applyResult(info)
      return info
    }
    catch (e: any) {
      state.value = 'loadError'
      errorMessage.value = e?.message || ''
      return null
    }
  }

  /** 启动轮询(非终态时) */
  function startPoll() {
    stopPoll()
    attempts = 0
    pollTimer = setInterval(async () => {
      attempts++
      if (attempts > maxAttempts) {
        stopPoll()
        return
      }
      const info = await fetchOnce()
      if (info?.finalState) {
        stopPoll()
      }
    }, intervalMs)
  }

  /** 初始化: 查询一次, 非终态则启动轮询 */
  async function init() {
    state.value = 'loading'
    // 同会话已跳转过: 标记重入态, 不再自动倒计时跳转(防刷新/回退/重访重复跳商户)
    if (sessionStorage.getItem(redirectedKey)) {
      isReentry.value = true
    }
    const info = await fetchOnce()
    if (info && !info.finalState) {
      startPoll()
    }
  }

  /** 用户点击「返回商户」立即跳转(不等倒计时) */
  function redirectNow() {
    stopCountdown()
    if (result.value.redirectUrl) {
      markRedirected()
      window.location.href = result.value.redirectUrl
    }
  }

  onUnmounted(() => {
    stopPoll()
    stopCountdown()
  })

  return {
    result,
    state,
    errorMessage,
    redirectCountdown,
    isReentry,
    init,
    redirectNow,
  }
}
