<script lang="ts" setup>
/**
 * PC 聚合落地：展示落地页 URL 二维码，引导手机钱包扫码支付
 * Web 风格居中卡片；终态展示标题/商户单号等订单摘要
 */
import type { GatewayOrderInfo } from '@/shared/api/gateway'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { getGatewayOrder } from '@/shared/api/gateway'
import alipaySvg from '@/shared/assets/icons/channel/alipay.svg'
import douyinSvg from '@/shared/assets/icons/channel/douyin.svg'
import unionPaySvg from '@/shared/assets/icons/channel/union_pay.svg'
import wechatSvg from '@/shared/assets/icons/channel/wechat.svg'
import QrCodeDisplay from '@/shared/components/pay/QrCodeDisplay.vue'
import { useGatewayOrderPoll } from '@/shared/hooks/use-gateway-order-poll'
import { closeWebview } from '@/shared/pay/close-webview'
import { fenToYuan } from '@/shared/utils/pay-amount'

defineOptions({ name: 'PcAggregatePage' })

const { t } = useI18n()
const route = useRoute()
const orderNo = route.params.orderNo as string

/** 与环境/提示静态段冲突的保留字（路由漏配时的兜底，避免误查单） */
const RESERVED_ORDER_SEGMENTS = new Set([
  'unsupported',
  'wechat',
  'alipay',
  'union-pay',
  'douyin',
])

const loading = ref(true)
const loadError = ref('')
const order = ref<GatewayOrderInfo>({})

const remainSeconds = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const amountYuan = computed(() => fenToYuan(order.value.amount))
const paid = computed(() => order.value.status === 'paid')
const closed = computed(() => order.value.status === 'closed')
const failed = computed(() => order.value.status === 'failed')
const expired = computed(() =>
  order.value.status === 'expired'
  || (remainSeconds.value <= 0 && !!order.value.expiredTime && !paid.value && !closed.value && !failed.value),
)
/** 终态：不可再付 */
const terminal = computed(() =>
  paid.value || closed.value || failed.value || order.value.status === 'expired' || expired.value,
)

/** 落地页 URL 二维码内容（与后端 GatewayPayAssistService 契约一致，无调试 query） */
const qrUrl = computed(() => buildAggregateLandingUrl(orderNo))

/** 是否展示扫码主区域 */
const showScanArea = computed(() => !loading.value && !loadError.value && !terminal.value)

/** 结果态是否有可展示的订单摘要（loadError 通常无） */
const hasOrderSummary = computed(() => !!order.value.orderNo || !!order.value.bizOrderNo || !!order.value.title)

/** 结果态：closed / failed / expired / loadError / paid */
type ResultState = 'paid' | 'closed' | 'failed' | 'expired' | 'loadError' | ''
const resultState = computed<ResultState>(() => {
  if (loadError.value) {
    return 'loadError'
  }
  if (paid.value) {
    return 'paid'
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

const resultMeta = computed(() => {
  switch (resultState.value) {
    case 'paid':
      return { titleKey: 'aggregate.paid', tipKey: 'aggregate.paidTip', color: '#07c160' }
    case 'closed':
      return { titleKey: 'aggregate.closed', tipKey: 'aggregate.closedTip', color: '#fa8c16' }
    case 'failed':
      return { titleKey: 'aggregate.failed', tipKey: 'aggregate.failedTip', color: '#ff4d4f' }
    case 'expired':
      return { titleKey: 'aggregate.expired', tipKey: 'aggregate.expiredTip', color: '#8c8c8c' }
    case 'loadError':
      return { titleKey: 'aggregate.loadFail', tipKey: 'aggregate.loadFailTip', color: '#fa8c16' }
    default:
      return { titleKey: '', tipKey: '', color: 'var(--h5-text-primary)' }
  }
})

const countdown = computed(() => {
  const s = remainSeconds.value
  const h = String(Math.floor(s / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return { h, m, s: sec }
})

const walletIcons = [
  { src: wechatSvg, alt: 'WeChat' },
  { src: alipaySvg, alt: 'Alipay' },
  { src: unionPaySvg, alt: 'UnionPay' },
  { src: douyinSvg, alt: 'Douyin' },
]

const { startPoll, stopPoll } = useGatewayOrderPoll({
  // 聚合 PC 等手机付完，适当放宽轮询时长（约 10 分钟）
  maxAttempts: 300,
  intervalMs: 2000,
  onUpdate(latest) {
    order.value = latest
  },
  onPaid(latest) {
    order.value = latest
    redirectIfNeeded()
  },
})

/**
 * 构建聚合落地 URL（供手机扫码）
 * 不含 ?device= 等调试参数，避免手机仍进 PC
 */
function buildAggregateLandingUrl(no: string): string {
  if (!no || typeof window === 'undefined') {
    return ''
  }
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
  const path = `${base}aggregate/${encodeURIComponent(no)}`
  // 合并 origin + path，折叠多余斜杠（保留协议后的 //）
  return `${window.location.origin}${path}`.replace(/([^:]\/)\/+/g, '$1')
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

/** 支付成功后若有 returnUrl 则延迟跳转 */
function redirectIfNeeded() {
  if (order.value.returnUrl) {
    setTimeout(() => {
      window.location.href = order.value.returnUrl!
    }, 1200)
  }
}

async function loadOrder() {
  loading.value = true
  loadError.value = ''
  // 保留字：不请求接口（正常应由 /aggregate/unsupported 等静态路由承接）
  if (!orderNo || RESERVED_ORDER_SEGMENTS.has(orderNo)) {
    loadError.value = t('aggregate.useMobileScan')
    loading.value = false
    return
  }
  try {
    order.value = await getGatewayOrder(orderNo)
    startCountdown(order.value.expiredTime)
    // 可支付：展示落地码并轮询等待手机侧完成支付
    if (!terminal.value) {
      startPoll(orderNo)
    }
  }
  catch (e: any) {
    loadError.value = e?.message || t('aggregate.loadFail')
  }
  finally {
    loading.value = false
  }
}

// 倒计时归零：停轮询（expired 计算会切到结果态）
watch(expired, (isExpired) => {
  if (isExpired && !paid.value) {
    stopPoll()
  }
})

onMounted(() => {
  loadOrder()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  stopPoll()
})
</script>

<template>
  <div class="pc-aggregate">
    <div class="pc-aggregate__card">
      <!-- 加载 -->
      <div v-if="loading" class="pc-aggregate__loading">
        <div class="pc-aggregate__spinner" />
        <p>{{ t('common.loading') }}</p>
      </div>

      <!-- 结果态：成功 / 关闭 / 失败 / 过期 / 加载失败 -->
      <div v-else-if="resultState" class="pc-aggregate__result">
        <div
          class="pc-aggregate__result-icon"
          :style="{ color: resultMeta.color, background: `${resultMeta.color}1a` }"
        >
          <svg
            viewBox="0 0 48 48"
            width="52"
            height="52"
            fill="none"
            :stroke="resultMeta.color"
            stroke-width="3.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <!-- 支付成功 -->
            <template v-if="resultState === 'paid'">
              <circle cx="24" cy="24" r="17" />
              <path d="M15 24 L22 31 L34 17" />
            </template>
            <!-- 支付失败 -->
            <template v-else-if="resultState === 'failed'">
              <path d="M14 14 L34 34 M34 14 L14 34" stroke-width="4" />
            </template>
            <!-- 已过期 -->
            <template v-else-if="resultState === 'expired'">
              <circle cx="24" cy="24" r="17" />
              <path d="M24 13 V24 L32 28" />
            </template>
            <!-- 已关闭：锁 -->
            <template v-else-if="resultState === 'closed'">
              <rect x="10" y="22" width="28" height="18" rx="3" />
              <path d="M15 22 V15 a9 9 0 0 1 18 0 V22" />
            </template>
            <!-- 加载失败：警告 -->
            <template v-else>
              <path d="M24 6 L43 39 H5 Z" />
              <path d="M24 19 V29" />
              <circle cx="24" cy="35" r="1.5" :fill="resultMeta.color" stroke="none" />
            </template>
          </svg>
        </div>
        <h1 class="pc-aggregate__result-title">
          {{ t(resultMeta.titleKey) }}
        </h1>
        <!-- loadError 态显示后端返回的具体原因，无消息时不渲染 -->
        <p v-if="resultState !== 'loadError' || loadError" class="pc-aggregate__result-tip">
          {{ resultState === 'loadError' ? loadError : t(resultMeta.tipKey) }}
        </p>

        <!-- 订单摘要：标题 / 商户单号 / 平台单号 / 金额 -->
        <div v-if="hasOrderSummary" class="pc-aggregate__summary">
          <div class="pc-aggregate__info-row">
            <span>{{ t('aggregate.orderTitle') }}</span>
            <span>{{ order.title || t('aggregate.defaultTitle') }}</span>
          </div>
          <div v-if="order.bizOrderNo" class="pc-aggregate__info-row">
            <span>{{ t('aggregate.bizOrderNo') }}</span>
            <span>{{ order.bizOrderNo }}</span>
          </div>
          <div v-if="order.orderNo" class="pc-aggregate__info-row">
            <span>{{ t('aggregate.orderNo') }}</span>
            <span>{{ order.orderNo }}</span>
          </div>
          <div v-if="order.amount != null" class="pc-aggregate__info-row">
            <span>{{ t('aggregate.amount') }}</span>
            <span class="pc-aggregate__info-amount">¥{{ amountYuan }}</span>
          </div>
        </div>

        <!-- 关闭页面（异常/成功兜底） -->
        <button type="button" class="pc-aggregate__close-btn" @click="closeWebview">
          {{ t('aggregate.closePage') }}
        </button>
      </div>

      <!-- 可支付：金额 + 落地码 + 引导 + 订单摘要（Web 默认展示） -->
      <template v-else-if="showScanArea">
        <div class="pc-aggregate__amount">
          <span class="pc-aggregate__currency">¥</span>
          <span class="pc-aggregate__amount-num">{{ amountYuan }}</span>
        </div>

        <div class="pc-aggregate__qr">
          <div class="pc-aggregate__qr-box">
            <QrCodeDisplay v-if="qrUrl" :content="qrUrl" :size="240" />
          </div>
          <div v-if="remainSeconds > 0" class="pc-aggregate__countdown">
            <!-- 剩余支付时间 -->
            <span class="pc-aggregate__countdown-label">{{ t('aggregate.remainingTime') }}</span>
            <span class="pc-aggregate__countdown-item">{{ countdown.h }}</span>
            <span class="pc-aggregate__countdown-sep">:</span>
            <span class="pc-aggregate__countdown-item">{{ countdown.m }}</span>
            <span class="pc-aggregate__countdown-sep">:</span>
            <span class="pc-aggregate__countdown-item">{{ countdown.s }}</span>
          </div>
        </div>

        <div class="pc-aggregate__scan-tip">
          <div class="pc-aggregate__icons">
            <img
              v-for="icon in walletIcons"
              :key="icon.alt"
              :src="icon.src"
              :alt="icon.alt"
              class="pc-aggregate__icon"
            >
          </div>
          <!-- 请使用钱包扫一扫完成支付 -->
          <p class="pc-aggregate__scan-text">
            {{ t('aggregate.scanWithWallet') }}
          </p>
        </div>

        <!-- 订单摘要：Web 宽屏默认展示，无需折叠 -->
        <div class="pc-aggregate__summary">
          <div class="pc-aggregate__info-row">
            <span>{{ t('aggregate.orderTitle') }}</span>
            <span>{{ order.title || t('aggregate.defaultTitle') }}</span>
          </div>
          <div v-if="order.description" class="pc-aggregate__info-row">
            <span>{{ t('aggregate.description') }}</span>
            <span>{{ order.description }}</span>
          </div>
          <div v-if="order.bizOrderNo" class="pc-aggregate__info-row">
            <span>{{ t('aggregate.bizOrderNo') }}</span>
            <span>{{ order.bizOrderNo }}</span>
          </div>
          <div class="pc-aggregate__info-row">
            <span>{{ t('aggregate.orderNo') }}</span>
            <span>{{ order.orderNo }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* PC Web：scoped 原生 px，禁止 UnoCSS 长度类 */
.pc-aggregate {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--h5-bg-page);
  padding: 40px 24px;
  box-sizing: border-box;
}

.pc-aggregate__card {
  width: 100%;
  max-width: 540px;
  padding: 40px 36px 32px;
  background: var(--h5-bg-card);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgb(0 0 0 / 8%);
  text-align: center;
  box-sizing: border-box;
}

.pc-aggregate__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 56px 0;
  color: var(--h5-text-secondary);
  font-size: 14px;
}

.pc-aggregate__spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e4e7ed;
  border-top-color: #4787f7;
  border-radius: 50%;
  animation: pc-aggregate-spin 0.8s linear infinite;
}

@keyframes pc-aggregate-spin {
  to {
    transform: rotate(360deg);
  }
}

.pc-aggregate__amount {
  margin-bottom: 28px;
  line-height: 1.1;
}

.pc-aggregate__currency {
  font-size: 22px;
  font-weight: 500;
  color: #ff4d4f;
  margin-right: 4px;
  vertical-align: super;
}

.pc-aggregate__amount-num {
  font-size: 44px;
  font-weight: 600;
  color: #ff4d4f;
  letter-spacing: -0.5px;
}

.pc-aggregate__qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
}

.pc-aggregate__qr-box {
  width: 280px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 16px;
  background: var(--h5-bg-muted);
}

.pc-aggregate__countdown {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 14px;
}

.pc-aggregate__countdown-label {
  color: var(--h5-text-secondary);
  margin-right: 6px;
}

.pc-aggregate__countdown-item {
  display: inline-block;
  min-width: 28px;
  padding: 3px 6px;
  background: #ff4d4f;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border-radius: 4px;
  text-align: center;
  line-height: 1.3;
  box-sizing: border-box;
  font-variant-numeric: tabular-nums;
}

.pc-aggregate__countdown-sep {
  font-size: 14px;
  font-weight: 600;
  color: #ff4d4f;
}

.pc-aggregate__scan-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0 4px;
}

.pc-aggregate__icons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.pc-aggregate__icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.pc-aggregate__scan-text {
  margin: 0;
  font-size: 14px;
  color: var(--h5-text-secondary);
  line-height: 1.6;
}

/* 订单摘要：左右标签值，Web 表格式信息区 */
.pc-aggregate__summary {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--h5-border);
  text-align: left;
}

.pc-aggregate__info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  padding: 8px 0;
  font-size: 13px;
  line-height: 1.5;
}

.pc-aggregate__info-row > span:first-child {
  color: var(--h5-text-secondary);
  flex-shrink: 0;
  min-width: 88px;
}

.pc-aggregate__info-row > span:last-child {
  color: var(--h5-text-primary);
  text-align: right;
  word-break: break-all;
}

.pc-aggregate__info-amount {
  color: #ff4d4f !important;
  font-weight: 600;
}

.pc-aggregate__result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0 4px;
}

.pc-aggregate__result-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.pc-aggregate__result-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--h5-text-primary);
  line-height: 1.4;
}

.pc-aggregate__result-tip {
  margin: 0;
  font-size: 14px;
  color: var(--h5-text-secondary);
  line-height: 1.6;
  max-width: 360px;
}

.pc-aggregate__result .pc-aggregate__summary {
  width: 100%;
}

.pc-aggregate__close-btn {
  margin-top: 24px;
  width: 100%;
  max-width: 280px;
  height: 44px;
  border-radius: 22px;
  border: none;
  background: linear-gradient(135deg, var(--h5-brand-cashier) 0%, var(--h5-brand-cashier-deep) 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(93, 157, 254, 0.3);
}

.pc-aggregate__close-btn:hover {
  opacity: 0.92;
}
</style>
