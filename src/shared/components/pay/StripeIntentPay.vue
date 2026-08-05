<script lang="ts" setup>
import type { StripeJsCardElement, StripeJsClient } from '@/shared/pay/stripe'

/**
 * Stripe PaymentIntent 卡支付面板（弹层）
 *
 * 动态加载 https://js.stripe.com/v3/ + Elements Card Element 收集卡信息，
 * 确认后调 confirmCardPayment 完成支付（3DS 由 Stripe.js 自动处理）。
 * 成功（Stripe 已确认）/ 已受理（需轮询）/ 取消均通过事件上抛，由收银台页面接管。
 */
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useLocale } from '@/shared/locales'
import {
  confirmStripePayment,
  createStripeClient,
  parseStripeIntentPayload,
  toStripeLocale,
} from '@/shared/pay/stripe'

const props = withDefaults(defineProps<{
  /** 面板可见性 */
  visible: boolean
  /** stripe_intent 原始 payBody（JSON 或纯 client_secret 字符串） */
  payload: string
  /** 支付标题（订单标题） */
  title?: string
  /** 支付金额（元，展示用） */
  amountYuan?: string
}>(), {
  title: '',
  amountYuan: '',
})

const emit = defineEmits<{
  /** Stripe 已确认扣款成功 */
  success: []
  /** 已受理未终态（3DS 处理中 / processing），需上层轮询订单 */
  pending: []
  /** 用户关闭面板 */
  cancel: []
}>()

const { t, locale } = useLocale()

// Card Element 挂载容器
const cardElementRef = ref<HTMLElement | null>(null)
// Stripe.js / Elements 初始化中
const loading = ref(true)
// 初始化失败原因（脚本加载失败 / 缺少 publishableKey / 参数无效）
const initError = ref('')
// 支付确认错误（卡被拒 / 3DS 未完成等）
const confirmError = ref('')
// 卡信息是否完整（由 Card Element change 事件驱动，控制确认按钮）
const cardComplete = ref(false)
// 确认支付请求中
const confirming = ref(false)

let stripeClient: StripeJsClient | null = null
let cardElement: StripeJsCardElement | null = null

/**
 * 打开面板：解析 payload → 加载 Stripe.js → 创建并挂载 Card Element
 */
async function initStripe() {
  loading.value = true
  initError.value = ''
  confirmError.value = ''
  cardComplete.value = false
  const parsed = parseStripeIntentPayload(props.payload)
  if (!parsed?.clientSecret) {
    // 后端未返回 client_secret，无法发起支付
    initError.value = t('cashier.stripePayloadInvalid')
    loading.value = false
    return
  }
  if (!parsed.publishableKey) {
    // 缺 publishableKey 无法初始化 Stripe.js
    initError.value = t('cashier.stripeKeyMissing')
    loading.value = false
    return
  }
  try {
    stripeClient = await createStripeClient(parsed.publishableKey)
    // 卡输入框语言随当前界面语言
    cardElement = stripeClient.elements({ locale: toStripeLocale(locale.value) }).create('card')
    cardElement.on('change', (event) => {
      cardComplete.value = !!event.complete
      confirmError.value = event.error?.message || ''
    })
    // 等 Card Element 容器渲染完成再挂载
    await nextTick()
    cardElement.mount(cardElementRef.value as HTMLElement)
  }
  catch (e: any) {
    // 脚本加载 / 初始化异常
    initError.value = e?.message || t('cashier.stripeLoadFail')
  }
  finally {
    loading.value = false
  }
}

/**
 * 关闭面板并释放 Card Element（下次打开重建）
 */
function closePanel() {
  if (cardElement) {
    cardElement.destroy()
    cardElement = null
  }
  emit('cancel')
}

/**
 * 确认支付：卡信息完整且已就绪时提交
 */
async function handleConfirm() {
  const parsed = parseStripeIntentPayload(props.payload)
  if (confirming.value || !stripeClient || !cardElement || !cardComplete.value || !parsed) {
    return
  }
  confirming.value = true
  confirmError.value = ''
  try {
    const result = await confirmStripePayment(
      stripeClient,
      parsed.clientSecret,
      cardElement,
      parsed.returnUrl,
    )
    if (!result.ok) {
      // 卡被拒等：展示错误，允许修改卡信息重试
      confirmError.value = result.message
      return
    }
    if (result.status === 'succeeded') {
      // 已确认扣款成功：由页面渲染成功卡片
      emit('success')
    }
    else {
      // 已受理未终态：由页面轮询订单状态
      emit('pending')
    }
  }
  catch (e: any) {
    // 兜底（理论上 confirmStripePayment 已捕获异常）
    confirmError.value = e?.message || t('cashier.payFail')
  }
  finally {
    confirming.value = false
  }
}

watch(() => props.visible, (visible) => {
  if (visible) {
    void initStripe()
  }
  else if (cardElement) {
    // 关闭：释放 Card Element
    cardElement.destroy()
    cardElement = null
  }
})

onBeforeUnmount(() => {
  if (cardElement) {
    cardElement.destroy()
    cardElement = null
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="stripe-intent">
      <div class="stripe-intent__mask" @click="closePanel" />
      <div class="stripe-intent__panel">
        <div class="stripe-intent__header">
          <span class="stripe-intent__brand">Stripe</span>
          <button class="stripe-intent__close" @click="closePanel">
            ×
          </button>
        </div>
        <div class="stripe-intent__title">
          {{ title || t('cashier.stripeIntentTitle') }}
        </div>
        <div v-if="amountYuan" class="stripe-intent__amount">
          ￥{{ amountYuan }}
        </div>
        <p class="stripe-intent__desc">
          {{ t('cashier.stripeCardTip') }}
        </p>
        <div class="stripe-intent__card">
          <div v-if="loading" class="stripe-intent__loading">
            {{ t('common.loading') }}
          </div>
          <div v-if="initError" class="stripe-intent__error">
            {{ initError }}
          </div>
          <div v-show="!loading && !initError" ref="cardElementRef" class="stripe-intent__element" />
        </div>
        <div v-if="confirmError" class="stripe-intent__error">
          {{ confirmError }}
        </div>
        <button
          class="stripe-intent__pay-btn"
          :disabled="confirming || !cardComplete || !!initError || loading"
          @click="handleConfirm"
        >
          {{ confirming ? t('cashier.paying') : t('cashier.stripePayNow') }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="less">
// Stripe 支付面板：居中弹层，移动/PC 通用
.stripe-intent {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;

  &__mask {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
  }

  &__panel {
    position: relative;
    width: 100%;
    max-width: 420px;
    background: var(--h5-bg-card);
    border-radius: 16px;
    padding: 24px;
    box-sizing: border-box;
    box-shadow: 0 12px 40px rgba(15, 23, 42, 0.2);
    animation: stripe-intent-pop 0.3s ease-out;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  // Stripe 品牌字：斜体 + 品牌紫
  &__brand {
    font-size: 22px;
    font-weight: 800;
    font-style: italic;
    color: #635bff;
    letter-spacing: -0.5px;
  }

  &__close {
    border: none;
    background: none;
    font-size: 22px;
    line-height: 1;
    color: var(--h5-text-secondary);
    cursor: pointer;
    padding: 4px;
  }

  &__title {
    font-size: 17px;
    font-weight: 600;
    color: var(--h5-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // 金额红：与收银台一致
  &__amount {
    margin-top: 6px;
    font-size: 24px;
    font-weight: 700;
    color: #ff4d4f;
  }

  &__desc {
    margin: 8px 0 12px;
    font-size: 13px;
    color: var(--h5-text-secondary);
  }

  // Card Element 输入容器（iframe 由 Stripe 注入）
  &__card {
    position: relative;
    border: 1px solid var(--h5-border);
    border-radius: 8px;
    padding: 12px;
    min-height: 44px;
    box-sizing: border-box;
    background: var(--h5-bg-muted);
  }

  &__element {
    min-height: 20px;
  }

  &__loading {
    font-size: 13px;
    color: var(--h5-text-secondary);
    text-align: center;
  }

  &__error {
    margin-top: 10px;
    font-size: 13px;
    line-height: 1.5;
    color: #ff4d4f;
    word-break: break-word;
  }

  &__pay-btn {
    margin-top: 20px;
    width: 100%;
    height: 46px;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    color: #fff;
    background: linear-gradient(135deg, var(--h5-brand-cashier) 0%, var(--h5-brand-cashier-deep) 100%);
    cursor: pointer;

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }
}

@keyframes stripe-intent-pop {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
