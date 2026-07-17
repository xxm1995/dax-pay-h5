/**
 * 码牌端页共用逻辑: 加载信息 / OAuth / 支付 / 轮询
 * 复用 gateway 同族工具: pay-openid / pay-result / jsapi / pay-amount
 */
import type { CodePayInfo, CodePayResult } from '@/shared/api/code-pay'
import { showNotify, showSuccessToast } from 'vant'
import { computed, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  codePay,
  generateCodeAuthUrl,
  getCodeOrderStatus,
  getCodePayInfo,
} from '@/shared/api/code-pay'
import { invokeJsapiByEnv } from '@/shared/pay/jsapi'
import { yuanToFen } from '@/shared/utils/pay-amount'
import { clearPayOpenId, getPayOpenId } from '@/shared/utils/pay-openid'
import {
  redirectToPayUrl,
  resolvePayResult,
  submitPayForm,
} from '@/shared/utils/pay-result'

export interface UseCodePayPageOptions {
  /** 码牌编码 */
  code: string
  /** 写死的客户端环境 */
  clientEnv: 'wechat' | 'alipay'
}

/**
 * 码牌端页 composable
 */
export function useCodePayPage(options: UseCodePayPageOptions) {
  const { t } = useI18n()
  const { code, clientEnv } = options

  const loading = ref(true)
  const paying = ref(false)
  const loadError = ref('')
  const info = ref<CodePayInfo>({})
  const payResult = ref<CodePayResult | null>(null)
  const openId = ref<string | undefined>()
  const amount = ref('0')
  const description = ref('')
  const authRedirecting = ref(false)

  let pollTimer: ReturnType<typeof setInterval> | null = null

  const displayAmount = computed(() => {
    if (info.value.amountType === 'fixed' && info.value.fixedAmount) {
      return (info.value.fixedAmount / 100).toFixed(2)
    }
    return amount.value
  })

  const paid = computed(() => {
    const s = payResult.value?.status
    return s === 'success' || s === 'paid'
  })

  onUnmounted(() => {
    stopPoll()
  })

  /**
   * 初始化: 取 openId → 拉码牌 → 必要时 OAuth
   */
  async function init() {
    loading.value = true
    loadError.value = ''
    // 授权回跳后 openId 已由 auth-return 写入(key=code+clientEnv)
    const stored = getPayOpenId(code, clientEnv)
    if (stored) {
      openId.value = stored
      clearPayOpenId(code, clientEnv)
    }
    try {
      info.value = await getCodePayInfo(code, clientEnv)
      if (info.value.programType === 'mini_app') {
        loadError.value = t('codePay.miniAppOnly')
        return
      }
      // 需要 openId 且尚未拿到 → 跳转授权
      if (info.value.needOpenId && !openId.value) {
        authRedirecting.value = true
        const auth = await generateCodeAuthUrl({ code, clientEnv })
        if (auth?.authUrl) {
          window.location.replace(auth.authUrl)
          return
        }
        loadError.value = t('codePay.authUrlFail')
        authRedirecting.value = false
      }
    }
    catch (e: any) {
      loadError.value = e?.message || t('codePay.loadFail')
    }
    finally {
      loading.value = false
    }
  }

  /**
   * 金额键盘输入
   */
  function onInput(key: string) {
    if (key === '.' && amount.value.includes('.')) {
      return
    }
    // 最多两位小数
    const dot = amount.value.indexOf('.')
    if (dot >= 0 && amount.value.length - dot > 2 && key !== '.') {
      return
    }
    if (amount.value === '0' && key !== '.') {
      amount.value = key
    }
    else {
      amount.value += key
    }
  }

  function onDelete() {
    amount.value = amount.value.slice(0, -1) || '0'
  }

  /**
   * 应用支付结果(与聚合页分发语义对齐)
   */
  async function applyPayResult(result: CodePayResult | null) {
    payResult.value = result
    const action = resolvePayResult(result)
    switch (action.type) {
      case 'success':
        showSuccessToast(t('codePay.paySuccess'))
        return
      case 'redirect':
        redirectToPayUrl(action.url, true)
        return
      case 'form':
        submitPayForm(action.html)
        return
      case 'jsapi':
        try {
          await invokeJsapiByEnv(clientEnv, action.payload)
          payResult.value = { ...result, status: 'success' }
          showSuccessToast(t('codePay.paySuccess'))
        }
        catch (e: any) {
          if (e?.message === 'cancel') {
            showNotify({ type: 'warning', message: t('codePay.jsapiCancelOrFail') })
          }
          else {
            showNotify({ type: 'warning', message: e?.message || t('codePay.jsapiCancelOrFail') })
          }
          if (result?.orderNo) {
            startPoll(result.orderNo)
          }
        }
        return
      case 'qrcode':
      case 'unsupported':
      case 'poll':
      default:
        if (result?.orderNo) {
          startPoll(result.orderNo)
        }
        else {
          showNotify({ type: 'warning', message: t('codePay.payPending') })
        }
    }
  }

  /**
   * 确认支付
   */
  async function pay() {
    if (paying.value || paid.value) {
      return
    }
    if (info.value.programType === 'mini_app') {
      showNotify({ type: 'warning', message: t('codePay.miniAppOnly') })
      return
    }
    let amountFen: number | undefined
    if (info.value.amountType === 'random') {
      amountFen = yuanToFen(amount.value)
      if (!amountFen) {
        showNotify({ type: 'warning', message: t('codePay.amountZero') })
        return
      }
    }
    if (info.value.needOpenId && !openId.value) {
      showNotify({ type: 'warning', message: t('codePay.needAuth') })
      return
    }
    paying.value = true
    try {
      const result = await codePay({
        code,
        amount: amountFen,
        description: description.value || undefined,
        clientEnv,
        runtime: 'h5',
        openId: openId.value,
        device: 'mobile',
      })
      await applyPayResult(result)
    }
    catch (e: any) {
      showNotify({ type: 'danger', message: e?.message || t('codePay.payFail') })
    }
    finally {
      paying.value = false
    }
  }

  function startPoll(orderNo: string) {
    stopPoll()
    let tries = 0
    pollTimer = setInterval(async () => {
      tries++
      if (tries > 30) {
        stopPoll()
        showNotify({ type: 'warning', message: t('codePay.pollTimeout') })
        return
      }
      try {
        const st = await getCodeOrderStatus(orderNo)
        if (st?.status === 'paid') {
          stopPoll()
          payResult.value = { ...payResult.value, status: 'success' }
          showSuccessToast(t('codePay.paySuccess'))
        }
        else if (st?.status === 'failed' || st?.status === 'closed' || st?.status === 'expired') {
          stopPoll()
          showNotify({ type: 'danger', message: t('codePay.payFail') })
        }
      }
      catch {
        // 忽略单次轮询错误
      }
    }, 2000)
  }

  function stopPoll() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  /**
   * 更新备注
   */
  function setDescription(value: string) {
    description.value = value
  }

  return {
    loading,
    paying,
    loadError,
    info,
    payResult,
    amount,
    description,
    setDescription,
    displayAmount,
    paid,
    authRedirecting,
    init,
    onInput,
    onDelete,
    pay,
  }
}
