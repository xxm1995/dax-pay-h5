/**
 * 网关订单状态轮询
 */
import type { GatewayOrderInfo } from '@/shared/api/gateway'
import { onUnmounted, ref } from 'vue'
import { getGatewayOrder } from '@/shared/api/gateway'

export interface UseGatewayOrderPollOptions {
  /** 轮询间隔 ms，默认 2000 */
  intervalMs?: number
  /** 最大次数，默认 90（约 3 分钟） */
  maxAttempts?: number
  /** 支付成功 */
  onPaid?: (order: GatewayOrderInfo) => void
  /** 达到上限仍未支付 */
  onTimeout?: () => void
  /** 每次刷新 */
  onUpdate?: (order: GatewayOrderInfo) => void
}

/**
 * 轮询网关订单直至 paid 或达到上限
 */
export function useGatewayOrderPoll(options: UseGatewayOrderPollOptions = {}) {
  const {
    intervalMs = 2000,
    maxAttempts = 90,
    onPaid,
    onTimeout,
    onUpdate,
  } = options

  const polling = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null
  let attempts = 0

  function stopPoll() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    polling.value = false
    attempts = 0
  }

  /**
   * 开始轮询
   * @param orderNo 网关单号
   */
  function startPoll(orderNo: string) {
    stopPoll()
    if (!orderNo) {
      return
    }
    polling.value = true
    attempts = 0

    timer = setInterval(async () => {
      attempts++
      if (attempts > maxAttempts) {
        stopPoll()
        onTimeout?.()
        return
      }
      try {
        const latest = await getGatewayOrder(orderNo)
        onUpdate?.(latest)
        // 终态（已支付/已关闭/已失败/已过期）停止轮询，避免对死单空跑约 3 分钟
        if (
          latest.status === 'paid'
          || latest.status === 'closed'
          || latest.status === 'failed'
          || latest.status === 'expired'
        ) {
          stopPoll()
          if (latest.status === 'paid') {
            onPaid?.(latest)
          }
        }
      }
      catch {
        // 忽略单次轮询错误
      }
    }, intervalMs)
  }

  onUnmounted(() => {
    stopPoll()
  })

  return {
    polling,
    startPoll,
    stopPoll,
  }
}
