import type { AggregatePayMeta, AggregatePayResult, GatewayOrderInfo } from '@/shared/api/gateway'
/**
 * 聚合扫码环境页共用编排
 * loadOrder → meta → OAuth → doPay → handlePayResult
 */
import type { AggregateClientEnv } from '@/shared/utils/client-env'
import { computed, onUnmounted, ref } from 'vue'
import {
  aggregatePay,
  generateGatewayAuthUrl,
  getAggregateMeta,
  getGatewayOrder,
} from '@/shared/api/gateway'
import { useGatewayOrderPoll } from '@/shared/hooks/use-gateway-order-poll'
import { invokeJsapiByEnv } from '@/shared/pay/jsapi'
import { buildAggregateEnvPath } from '@/shared/utils/client-env'
import { fenToYuan } from '@/shared/utils/pay-amount'
import { getPayOpenId } from '@/shared/utils/pay-openid'
import {
  redirectToPayUrl,
  resolvePayResult,
  submitPayForm,
} from '@/shared/utils/pay-result'

export interface UseAggregatePayOptions {
  orderNo: string
  clientEnv: AggregateClientEnv
  /** mobile | pc */
  device?: string
  onPaid?: () => void
  onError?: (message: string) => void
  /** i18n 文案回调 */
  t: (key: string) => string
}

/**
 * 网关订单是否终态不可再付
 */
export function isGatewayOrderTerminal(status?: string): boolean {
  return status === 'paid'
    || status === 'failed'
    || status === 'closed'
    || status === 'expired'
}

/**
 * 聚合环境页编排
 */
export function useAggregatePay(options: UseAggregatePayOptions) {
  const {
    orderNo,
    clientEnv,
    device = 'mobile',
    onPaid,
    onError,
    t,
  } = options

  const loading = ref(true)
  const paying = ref(false)
  const authorizing = ref(false)
  const loadError = ref('')
  const order = ref<GatewayOrderInfo>({})
  const meta = ref<AggregatePayMeta>({})
  const payResult = ref<AggregatePayResult | null>(null)
  const showQrcode = ref(false)
  const qrContent = ref('')
  const openId = ref('')

  const remainSeconds = ref(0)
  let countdownTimer: ReturnType<typeof setInterval> | null = null

  const amountYuan = computed(() => fenToYuan(order.value.amount))
  const paid = computed(() => order.value.status === 'paid')
  const terminal = computed(() => isGatewayOrderTerminal(order.value.status))
  const expired = computed(() =>
    remainSeconds.value <= 0 && !!order.value.expiredTime && !paid.value,
  )
  const countdown = computed(() => {
    const s = remainSeconds.value
    const m = String(Math.floor(s / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${m}:${sec}`
  })

  const { startPoll, stopPoll } = useGatewayOrderPoll({
    onUpdate(latest) {
      order.value = latest
    },
    onPaid(latest) {
      order.value = latest
      onPaid?.()
      redirectIfNeeded()
    },
  })

  function redirectIfNeeded() {
    if (order.value.returnUrl) {
      setTimeout(() => {
        window.location.href = order.value.returnUrl!
      }, 1200)
    }
  }

  function startCountdown(expiredTime?: string) {
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    if (!expiredTime) {
      remainSeconds.value = 0
      return
    }
    const exp = new Date(expiredTime).getTime()
    remainSeconds.value = Math.max(0, Math.floor((exp - Date.now()) / 1000))
    countdownTimer = setInterval(() => {
      if (remainSeconds.value > 0) {
        remainSeconds.value--
      }
      else if (countdownTimer) {
        clearInterval(countdownTimer)
        countdownTimer = null
      }
    }, 1000)
  }

  /**
   * 需要 OAuth 时跳转授权
   */
  async function ensureOpenId(): Promise<boolean> {
    if (!meta.value.needOpenId) {
      return true
    }
    if (openId.value) {
      return true
    }
    // 云闪付一期无平台 OAuth，跳过强制授权
    if (clientEnv === 'union_pay') {
      return true
    }
    authorizing.value = true
    try {
      const returnPath = buildAggregateEnvPath(orderNo, clientEnv)
      const authType = clientEnv === 'douyin' ? 'douyin' : clientEnv
      const result = await generateGatewayAuthUrl({
        orderNo,
        authType,
        returnPath,
      })
      if (!result?.authUrl) {
        onError?.(t('aggregate.authFail'))
        return false
      }
      window.location.href = result.authUrl
      return false
    }
    catch (e: any) {
      onError?.(e?.message || t('aggregate.authFail'))
      return false
    }
    finally {
      authorizing.value = false
    }
  }

  /**
   * 处理支付结果
   */
  async function applyPayResult(result: AggregatePayResult | null) {
    payResult.value = result
    const action = resolvePayResult(result)
    switch (action.type) {
      case 'success':
        order.value.status = 'paid'
        onPaid?.()
        redirectIfNeeded()
        break
      case 'redirect':
        redirectToPayUrl(action.url)
        break
      case 'qrcode':
        qrContent.value = action.content
        showQrcode.value = true
        startPoll(orderNo)
        break
      case 'form':
        submitPayForm(action.html)
        startPoll(orderNo)
        break
      case 'jsapi':
        try {
          await invokeJsapiByEnv(clientEnv, action.payload)
          startPoll(orderNo)
        }
        catch (e: any) {
          if (e?.message !== 'cancel') {
            onError?.(e?.message || t('aggregate.payFail'))
          }
          startPoll(orderNo)
        }
        break
      case 'unsupported':
        showQrcode.value = false
        startPoll(orderNo)
        break
      default:
        startPoll(orderNo)
        break
    }
  }

  /**
   * 发起支付
   */
  async function doPay() {
    if (paying.value || paid.value || expired.value || terminal.value) {
      return
    }
    if (!(await ensureOpenId())) {
      return
    }
    paying.value = true
    showQrcode.value = false
    qrContent.value = ''
    try {
      const result = await aggregatePay({
        orderNo,
        clientEnv,
        openId: openId.value || undefined,
        device,
        runtime: 'h5',
      })
      await applyPayResult(result)
    }
    catch (e: any) {
      onError?.(e?.message || t('aggregate.payFail'))
    }
    finally {
      paying.value = false
    }
  }

  /**
   * 加载订单 + meta，按 autoLaunch 决定是否自动支付
   */
  async function bootstrap() {
    loading.value = true
    loadError.value = ''
    openId.value = getPayOpenId(orderNo, clientEnv)
    try {
      order.value = await getGatewayOrder(orderNo)
      startCountdown(order.value.expiredTime)
      if (paid.value || terminal.value) {
        return
      }
      meta.value = await getAggregateMeta({
        orderNo,
        clientEnv,
        runtime: 'h5',
      })
      if (meta.value.needOpenId && !openId.value) {
        await ensureOpenId()
        return
      }
      // 仅配置显式 autoLaunch=true 时自动拉起
      if (meta.value.autoLaunch === true) {
        await doPay()
      }
    }
    catch (e: any) {
      loadError.value = e?.message || t('aggregate.loadFail')
    }
    finally {
      loading.value = false
    }
  }

  onUnmounted(() => {
    if (countdownTimer) {
      clearInterval(countdownTimer)
    }
    stopPoll()
  })

  return {
    loading,
    paying,
    authorizing,
    loadError,
    order,
    meta,
    payResult,
    showQrcode,
    qrContent,
    openId,
    remainSeconds,
    amountYuan,
    paid,
    terminal,
    expired,
    countdown,
    bootstrap,
    doPay,
    startPoll,
    stopPoll,
    redirectIfNeeded,
  }
}
