<script lang="ts" setup>
/**
 * PC WEB 收银台（cashierType=web，不按 clientEnv 分桶）
 */
import type { CashierItemPublic, GatewayOrderInfo } from '@/shared/api/gateway'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { cashierPay, getGatewayOrder, listCashierItems } from '@/shared/api/gateway'
import InitLoadingMask from '@/shared/components/pay/InitLoadingMask.vue'
import PayMethodIcon from '@/shared/components/pay/PayMethodIcon.vue'
import QrCodeDisplay from '@/shared/components/pay/QrCodeDisplay.vue'
import { useGatewayOrderPoll } from '@/shared/hooks/use-gateway-order-poll'
import { closeWebview } from '@/shared/pay/close-webview'
import { fenToYuan } from '@/shared/utils/pay-amount'
import {
  redirectToPayUrl,
  resolvePayResult,
  submitPayForm,
} from '@/shared/utils/pay-result'

defineOptions({ name: 'PcCashier' })

const { t } = useI18n()
const route = useRoute()
const orderNo = route.params.orderNo as string

const loading = ref(true)
const paying = ref(false)
const loadError = ref('')
const payError = ref('')
const order = ref<GatewayOrderInfo>({})
const payMethods = ref<CashierItemPublic[]>([])
const selectId = ref<string>('')
const showQrcode = ref(false)
const qrContent = ref('')

// 订单已锁定的支付项ID（订单支付中后端会标记唯一匹配项）; 非空时禁用切换其他项
const lockedItemId = computed(() => payMethods.value.find(i => i.locked)?.id || '')

const remainSeconds = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const amountYuan = computed(() => fenToYuan(order.value.amount))
const paid = computed(() => order.value.status === 'paid')
const expired = computed(() => remainSeconds.value <= 0 && !!order.value.expiredTime && !paid.value)

// 终态判定: 订单不可继续支付（用于跳过支付项请求并展示结果卡片）
const closed = computed(() => order.value.status === 'closed')
const failed = computed(() => order.value.status === 'failed')
const isTerminal = computed(() =>
  paid.value || closed.value || failed.value || order.value.status === 'expired' || expired.value,
)

// 结果态类型（关单/失败/过期/加载失败），非空时渲染结果卡片
type ResultState = 'closed' | 'failed' | 'expired' | 'loadError'
const resultState = computed<ResultState | ''>(() => {
  // 订单加载失败优先（订单不存在/网络异常）
  if (loadError.value) {
    return 'loadError'
  }
  if (closed.value) {
    return 'closed'
  }
  if (failed.value) {
    return 'failed'
  }
  if (order.value.status === 'expired' || expired.value) {
    return 'expired'
  }
  return ''
})

// 结果态展示元数据（图标/标题/副文案/主题色）
const resultMeta = computed(() => {
  switch (resultState.value) {
    case 'closed':
      return { icon: 'lock', titleKey: 'cashier.closed', tipKey: 'cashier.closedTip', color: '#fa8c16' }
    case 'failed':
      return { icon: 'cross', titleKey: 'cashier.failed', tipKey: 'cashier.failedTip', color: '#ff4d4f' }
    case 'expired':
      return { icon: 'clock-o', titleKey: 'cashier.expired', tipKey: 'cashier.expiredTip', color: '#8c8c8c' }
    default:
      return { icon: 'warning-o', titleKey: 'cashier.loadFail', tipKey: 'cashier.loadFailTip', color: '#fa8c16' }
  }
})

const countdown = computed(() => {
  const s = remainSeconds.value
  const h = String(Math.floor(s / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return { h, m, s: sec }
})

const { startPoll, stopPoll } = useGatewayOrderPoll({
  onUpdate(latest) {
    order.value = latest
  },
  onPaid(latest) {
    order.value = latest
    if (latest.returnUrl) {
      window.location.href = latest.returnUrl
    }
  },
})

function methodName(item?: CashierItemPublic | null) {
  if (!item) {
    return ''
  }
  if (item.name) {
    return item.name
  }
  const icon = item.icon || 'wechat'
  const key = `cashier.method.${icon}`
  const label = t(key)
  return label === key ? icon : label
}

/**
 * 选择支付项（订单已锁定支付方式时, 禁止切换到非锁定项）
 */
function selectPayMethod(itemId: string) {
  if (lockedItemId.value && itemId !== lockedItemId.value) {
    return
  }
  selectId.value = itemId
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

async function loadPage() {
  loading.value = true
  loadError.value = ''
  try {
    order.value = await getGatewayOrder(orderNo)
    startCountdown(order.value.expiredTime)
    // 仅可支付订单（非终态）请求支付项，避免对已关闭/失败/过期订单触发后端拦截异常
    if (!isTerminal.value) {
      // WEB 收银台: cashierType=web, clientEnv 不传
      payMethods.value = await listCashierItems({
        orderNo,
        cashierType: 'web',
      })
      // 订单已锁定支付方式: 强制选中锁定项; 否则推荐项/首项
      if (lockedItemId.value) {
        selectId.value = lockedItemId.value
      }
      else {
        const recommend = payMethods.value.find(i => i.recommend)
        selectId.value = (recommend || payMethods.value[0])?.id || ''
      }
    }
  }
  catch (e: any) {
    loadError.value = e?.message || t('cashier.loadFail')
  }
  finally {
    loading.value = false
  }
}

async function pay() {
  if (paying.value || paid.value || !selectId.value || expired.value) {
    return
  }
  paying.value = true
  payError.value = ''
  showQrcode.value = false
  qrContent.value = ''
  try {
    const result = await cashierPay({
      orderNo,
      itemId: selectId.value,
      cashierType: 'web',
      device: 'pc',
    })
    const action = resolvePayResult(result)
    switch (action.type) {
      case 'success':
        order.value.status = 'paid'
        if (order.value.returnUrl) {
          window.location.href = order.value.returnUrl
        }
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
        payError.value = t('cashier.jsapiPending')
        startPoll(orderNo)
        break
      case 'unsupported':
        payError.value = t('cashier.payLaunched')
        startPoll(orderNo)
        break
      case 'poll':
      default:
        startPoll(orderNo)
        break
    }
  }
  catch (e: any) {
    payError.value = e?.message || t('cashier.payFail')
  }
  finally {
    paying.value = false
  }
}

/**
 * 关闭页面（统一走 closeWebview）
 */
function closePage() {
  closeWebview()
}

onMounted(() => {
  loadPage()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  stopPoll()
})
</script>

<template>
  <div class="pc-cashier">
    <div class="pc-cashier__box">
      <!-- 加载态：统一全屏遮罩（替代原卡片内 spinner） -->
      <InitLoadingMask v-if="loading" />
      <!-- 结果态：订单已关闭/支付失败/已过期/加载失败 -->
      <div v-else-if="resultState" class="pc-cashier__result">
        <div
          class="pc-cashier__result-icon"
          :style="{ color: resultMeta.color, background: `${resultMeta.color}1a` }"
        >
          <svg
            class="pc-cashier__result-svg"
            viewBox="0 0 48 48"
            width="56"
            height="56"
            fill="none"
            :stroke="resultMeta.color"
            stroke-width="3.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <!-- 支付失败: 叉号 -->
            <template v-if="resultState === 'failed'">
              <path d="M14 14 L34 34 M34 14 L14 34" stroke-width="4" />
            </template>
            <!-- 已过期: 时钟 -->
            <template v-else-if="resultState === 'expired'">
              <circle cx="24" cy="24" r="17" />
              <path d="M24 13 V24 L32 28" />
            </template>
            <!-- 订单已关闭: 锁 -->
            <template v-else-if="resultState === 'closed'">
              <rect x="10" y="22" width="28" height="18" rx="3" />
              <path d="M15 22 V15 a9 9 0 0 1 18 0 V22" />
            </template>
            <!-- 加载失败: 警告三角 -->
            <template v-else>
              <path d="M24 6 L43 39 H5 Z" />
              <path d="M24 19 V29" />
              <circle cx="24" cy="35" r="1.5" :fill="resultMeta.color" stroke="none" />
            </template>
          </svg>
        </div>
        <div class="pc-cashier__result-title">
          {{ t(resultMeta.titleKey) }}
        </div>
        <div class="pc-cashier__result-subtitle">
          {{ resultState === 'loadError' ? (loadError || t(resultMeta.tipKey)) : t(resultMeta.tipKey) }}
        </div>
        <!-- 订单信息卡片 -->
        <div v-if="order.orderNo" class="pc-cashier__result-order">
          <div class="pc-cashier__result-row">
            <span>{{ t('cashier.orderTitle') }}</span>
            <span :title="order.title || t('cashier.demoOrderTitle')">{{ order.title || t('cashier.demoOrderTitle') }}</span>
          </div>
          <div class="pc-cashier__result-row">
            <span>{{ t('cashier.orderNo') }}</span>
            <span :title="order.orderNo">{{ order.orderNo }}</span>
          </div>
          <div v-if="order.amount" class="pc-cashier__result-row">
            <span>{{ t('cashier.payableAmount') }}</span>
            <span class="pc-cashier__result-amount">￥{{ amountYuan }}</span>
          </div>
        </div>
        <button class="pc-cashier__result-btn" @click="closePage">
          {{ t('cashier.closePage') }}
        </button>
      </div>
      <template v-else>
        <!-- 订单头部 -->
        <div class="pc-cashier__header">
          <div v-if="remainSeconds > 0 && !paid" class="pc-cashier__countdown">
            <span class="pc-cashier__countdown-label">{{ t('cashier.remainTimeShort') }}</span>
            <span class="pc-cashier__countdown-time">
              {{ countdown.h }}:{{ countdown.m }}:{{ countdown.s }}
            </span>
          </div>
          <div v-else-if="expired" class="pc-cashier__countdown">
            <span class="pc-cashier__countdown-time">{{ t('cashier.expired') }}</span>
          </div>
          <div
            class="pc-cashier__title"
            :title="order.title || t('cashier.demoOrderTitle')"
          >
            {{ order.title || t('cashier.demoOrderTitle') }}
          </div>
          <div class="pc-cashier__price">
            <span class="pc-cashier__price-label">{{ t('cashier.payableAmount') }}</span>
            <p>
              <span>￥</span>{{ amountYuan }}
            </p>
          </div>
          <div class="pc-cashier__order-no" :title="order.orderNo">
            {{ t('cashier.orderNoLabel') }}{{ order.orderNo }}
          </div>
        </div>

        <!-- 内容区 -->
        <div class="pc-cashier__content">
          <div v-if="paid" class="pc-cashier__paid">
            {{ t('cashier.paid') }}
          </div>
          <div v-else-if="payError" class="pc-cashier__error">
            {{ payError }}
          </div>
          <!-- 支付方式选择 -->
          <div v-else-if="!showQrcode" class="pc-cashier__methods">
            <div class="pc-cashier__section-title">
              {{ t('cashier.selectMethod') }}
            </div>
            <div v-if="!payMethods.length" class="pc-cashier__empty">
              {{ t('cashier.emptyItems') }}
            </div>
            <div v-else class="pc-cashier__grid">
              <div
                v-for="item in payMethods"
                :key="item.id"
                class="pc-cashier__method"
                :class="{
                  'pc-cashier__method--active': item.id === selectId,
                  'pc-cashier__method--disabled': lockedItemId && item.id !== lockedItemId,
                }"
                @click="selectPayMethod(item.id)"
              >
                <!-- 横向卡片: 图标 + 名称 + 推荐；选中靠边框/底色 -->
                <PayMethodIcon :icon="item.icon" :size="28" />
                <span class="pc-cashier__method-name">{{ methodName(item) }}</span>
                <span v-if="item.recommend" class="pc-cashier__recommend">{{ t('cashier.recommend') }}</span>
              </div>
            </div>
          </div>

          <!-- 二维码支付 -->
          <div v-else class="pc-cashier__qrcode">
            <div class="pc-cashier__qrcode-box">
              <span class="pc-cashier__corner pc-cashier__corner--tl" />
              <span class="pc-cashier__corner pc-cashier__corner--tr" />
              <span class="pc-cashier__corner pc-cashier__corner--bl" />
              <span class="pc-cashier__corner pc-cashier__corner--br" />
              <QrCodeDisplay :content="qrContent" :size="180" />
            </div>
            <div class="pc-cashier__qrcode-tip">
              <p class="pc-cashier__qrcode-title">
                {{ t('cashier.qrcodePay') }}
              </p>
              <p class="pc-cashier__qrcode-sub">
                {{ t('cashier.qrcodeTip', { name: methodName(payMethods.find(i => i.id === selectId)) }) }}
              </p>
            </div>
          </div>
        </div>

        <!-- 底部操作栏（流式布局，避免 absolute 压住支付项） -->
        <div v-if="!showQrcode && !paid" class="pc-cashier__footer">
          <div class="pc-cashier__footer-amount">
            <span class="pc-cashier__footer-label">{{ t('cashier.payableAmount') }}</span>
            <span class="pc-cashier__footer-value"><em>￥</em>{{ amountYuan }}</span>
          </div>
          <button
            class="pc-cashier__pay-btn"
            :disabled="paying || !selectId || expired"
            @click="pay"
          >
            {{ paying ? t('cashier.paying') : t('cashier.payNow') }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* PC 端收银台：scoped 原生 px + 媒体查询，不使用 UnoCSS 的 px 原子类 */
.pc-cashier {
  width: 100%;
  min-height: 100vh;
  background: var(--h5-bg-page);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px 16px;
  box-sizing: border-box;
}

.pc-cashier__box {
  width: 1100px;
  max-width: 100%;
  background: var(--h5-bg-card);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 520px;
}

.pc-cashier__loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 320px;
  color: var(--h5-text-secondary);
  font-size: 15px;
}

.pc-cashier__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--h5-brand-cashier);
  border-radius: 50%;
  animation: pc-cashier-spin 0.8s linear infinite;
}

.pc-cashier__header {
  background: linear-gradient(135deg, var(--h5-bg-brand-soft) 0%, var(--h5-bg-card) 100%);
  padding: 28px 40px 24px;
  border-bottom: 1px solid #edf2f7;
  position: relative;
}

.pc-cashier__countdown {
  position: absolute;
  right: 32px;
  top: 28px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.pc-cashier__countdown-label {
  font-size: 13px;
  color: var(--h5-text-secondary);
}

.pc-cashier__countdown-time {
  font-size: 15px;
  font-weight: 600;
  color: #ff4d4f;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
}

.pc-cashier__title {
  font-size: 17px;
  font-weight: 600;
  color: var(--h5-text-primary);
  padding-right: 180px;
  line-height: 1.4;
  /* 长标题单行省略，避免折行 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-cashier__price {
  margin-top: 20px;
  margin-bottom: 12px;
}

.pc-cashier__price-label {
  font-size: 14px;
  color: var(--h5-text-secondary);
}

.pc-cashier__price p {
  font-size: 44px;
  color: #ff4d4f;
  font-weight: 800;
  line-height: 1;
  margin: 6px 0 0;
  letter-spacing: -1px;
}

.pc-cashier__price p span {
  font-size: 22px;
  margin-right: 2px;
}

.pc-cashier__order-no {
  font-size: 13px;
  color: var(--h5-text-secondary);
  /* 长订单号单行省略 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-cashier__content {
  flex: 1;
  background: var(--h5-bg-card);
  padding: 28px 40px 20px;
  display: flex;
  flex-direction: column;
  min-height: 200px;
  box-sizing: border-box;
}

.pc-cashier__methods {
  width: 100%;
}

.pc-cashier__section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--h5-text-primary);
  margin-bottom: 16px;
}

.pc-cashier__paid {
  font-size: 18px;
  font-weight: 600;
  color: #07c160;
  text-align: center;
  padding: 40px 0;
}

.pc-cashier__error {
  color: #ff4d4f;
  font-size: 14px;
  text-align: center;
  padding: 24px 0;
}

.pc-cashier__result {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 40px;
  text-align: center;
  box-sizing: border-box;
  animation: pc-cashier-result-up 0.5s ease-out;
}

.pc-cashier__result-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-bottom: 28px;
  animation: pc-cashier-result-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pc-cashier__result-svg {
  display: block;
}

.pc-cashier__result-title {
  font-size: 26px;
  font-weight: 600;
  color: var(--h5-text-primary);
  margin-bottom: 10px;
}

.pc-cashier__result-subtitle {
  font-size: 15px;
  color: var(--h5-text-secondary);
  line-height: 1.6;
  max-width: 360px;
}

.pc-cashier__result-order {
  width: 100%;
  max-width: 360px;
  margin-top: 28px;
  padding: 20px 24px;
  background: var(--h5-bg-muted);
  border-radius: 12px;
}

.pc-cashier__result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  margin-bottom: 12px;
}

.pc-cashier__result-row:last-child {
  margin-bottom: 0;
}

.pc-cashier__result-row span:first-child {
  flex-shrink: 0;
  color: var(--h5-text-secondary);
}

.pc-cashier__result-row span:last-child {
  flex: 1;
  min-width: 0;
  color: var(--h5-text-primary);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pc-cashier__result-amount {
  color: var(--h5-brand-cashier) !important;
  font-weight: 600;
}

.pc-cashier__result-btn {
  margin-top: 32px;
  width: 240px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--h5-brand-cashier) 0%, var(--h5-brand-cashier-deep) 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(93, 157, 254, 0.3);
  transition: all 0.2s;
}

.pc-cashier__result-btn:hover {
  opacity: 0.92;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(93, 157, 254, 0.4);
}

.pc-cashier__empty {
  color: var(--h5-text-secondary);
  text-align: center;
  padding: 32px 16px;
  font-size: 14px;
}

/* 4 列横向卡片（与原布局一致） */
.pc-cashier__grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.pc-cashier__method {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 2px solid #f1f5f9;
  border-radius: 12px;
  height: 80px;
  cursor: pointer;
  background: var(--h5-bg-muted);
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.pc-cashier__method:hover {
  border-color: var(--h5-brand-cashier);
  background: var(--h5-bg-brand-soft);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(93, 157, 254, 0.12);
}

.pc-cashier__method--active {
  border-color: var(--h5-brand-cashier);
  background: var(--h5-bg-brand-soft);
  box-shadow: 0 4px 12px rgba(93, 157, 254, 0.18);
}

/* 订单已锁定支付方式: 非锁定项灰化不可选 */
.pc-cashier__method--disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

.pc-cashier__method-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--h5-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.pc-cashier__recommend {
  margin-left: auto;
  font-size: 12px;
  color: #f59e0b;
  background: var(--h5-bg-warning);
  border: 1px solid #fef3c7;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
  flex-shrink: 0;
}

.pc-cashier__qrcode {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding: 16px 0 24px;
  width: 100%;
}

.pc-cashier__qrcode-box {
  width: 200px;
  height: 200px;
  padding: 10px;
  border: 1px dashed var(--h5-brand-cashier);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(93, 157, 254, 0.08);
  position: relative;
  box-sizing: border-box;
}

.pc-cashier__corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid var(--h5-brand-cashier);
}

.pc-cashier__corner--tl {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
  border-top-left-radius: 4px;
}

.pc-cashier__corner--tr {
  top: -1px;
  right: -1px;
  border-left: none;
  border-bottom: none;
  border-top-right-radius: 4px;
}

.pc-cashier__corner--bl {
  bottom: -1px;
  left: -1px;
  border-right: none;
  border-top: none;
  border-bottom-left-radius: 4px;
}

.pc-cashier__corner--br {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
  border-bottom-right-radius: 4px;
}

.pc-cashier__qrcode-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--h5-text-primary);
  margin: 0 0 8px;
}

.pc-cashier__qrcode-sub {
  font-size: 14px;
  color: var(--h5-text-secondary);
  margin: 0;
}

/* 底部操作栏：流式布局，不压支付项 */
.pc-cashier__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 24px;
  padding: 16px 40px 28px;
  border-top: 1px solid #f1f5f9;
  background: var(--h5-bg-card);
}

.pc-cashier__footer-amount {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.pc-cashier__footer-label {
  font-size: 13px;
  color: var(--h5-text-secondary);
}

.pc-cashier__footer-value {
  font-size: 28px;
  font-weight: 800;
  color: #ff4d4f;
  line-height: 1;
}

.pc-cashier__footer-value em {
  font-style: normal;
  font-size: 16px;
  font-weight: 700;
  margin-right: 1px;
}

.pc-cashier__pay-btn {
  width: 200px;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, var(--h5-brand-cashier) 0%, var(--h5-brand-cashier-deep) 100%);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(93, 157, 254, 0.32);
  flex-shrink: 0;
}

.pc-cashier__pay-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(93, 157, 254, 0.4);
}

.pc-cashier__pay-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

@media (max-width: 768px) {
  .pc-cashier__box {
    border-radius: 12px;
  }

  .pc-cashier__header,
  .pc-cashier__content,
  .pc-cashier__footer {
    padding-left: 20px;
    padding-right: 20px;
  }

  .pc-cashier__title {
    padding-right: 0;
    margin-bottom: 8px;
  }

  .pc-cashier__countdown {
    position: static;
    margin-bottom: 12px;
    width: fit-content;
  }

  .pc-cashier__grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .pc-cashier__qrcode {
    flex-direction: column;
    gap: 20px;
  }

  .pc-cashier__footer {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .pc-cashier__footer-amount {
    justify-content: space-between;
  }

  .pc-cashier__pay-btn {
    width: 100%;
  }
}

@keyframes pc-cashier-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pc-cashier-result-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pc-cashier-result-pop {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
