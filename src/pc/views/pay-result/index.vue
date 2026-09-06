<script lang="ts" setup>
/**
 * 支付结果页(PC 端)
 *
 * 与移动端同 path(/pay-result/:tradeNo) 各指各 view。
 * 通道同步回跳(支付宝 PC 网页支付 return_url)落地页:
 * 凭 tradeNo 查订单状态, 支付成功 + 有 returnUrl 则倒计时带签名跳转, 否则展示结果结束页。
 *
 * PC 端样式用 scoped 原生 px(AGENTS.md PC 三约束: 禁用 UnoCSS px 原子类, 避免 mobile-forever 转 vw)。
 */
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import BeianFooter from '@/shared/components/BeianFooter.vue'
import { usePayResult } from '@/shared/hooks/use-pay-result'

const route = useRoute()
const { t } = useI18n()

const tradeNo = computed(() => route.params.tradeNo as string)
const { result, state, errorMessage, redirectCountdown, isReentry, init, redirectNow } = usePayResult(tradeNo.value)

type IconName = 'check' | 'cross' | 'lock' | 'clock' | 'warning' | 'loading'

const meta = computed<{ color: string, icon: IconName, titleKey: string, tipKey: string }>(() => {
  switch (state.value) {
    case 'paid':
      return { color: '#07c160', icon: 'check', titleKey: 'payResult.paid', tipKey: 'payResult.paidTip' }
    case 'failed':
      return { color: '#ee0a24', icon: 'cross', titleKey: 'payResult.failed', tipKey: 'payResult.failedTip' }
    case 'closed':
      return { color: '#fa8c16', icon: 'lock', titleKey: 'payResult.closed', tipKey: 'payResult.closedTip' }
    case 'expired':
      return { color: '#969799', icon: 'clock', titleKey: 'payResult.expired', tipKey: 'payResult.expiredTip' }
    case 'loadError':
      return { color: '#fa8c16', icon: 'warning', titleKey: 'payResult.loadFail', tipKey: 'payResult.loadFailTip' }
    default:
      return { color: '#1989fa', icon: 'loading', titleKey: 'payResult.processing', tipKey: '' }
  }
})

const title = computed(() => t(meta.value.titleKey))
const tip = computed(() => {
  if (state.value === 'loadError') {
    return errorMessage.value || t('payResult.loadFailTip')
  }
  return meta.value.tipKey ? t(meta.value.tipKey) : ''
})

const showRedirect = computed(() => state.value === 'paid' && !!result.value.redirectUrl && !isReentry.value)

const summaryRows = computed(() => {
  if (state.value === 'loading') {
    return []
  }
  const rows: Array<{ label: string, value: string }> = []
  if (result.value.title) {
    rows.push({ label: t('payResult.orderTitle'), value: result.value.title })
  }
  if (result.value.amount != null) {
    rows.push({ label: t('payResult.amount'), value: `¥${formatAmount(result.value.amount)}` })
  }
  if (result.value.orderNo) {
    rows.push({ label: t('payResult.orderNo'), value: result.value.orderNo })
  }
  return rows
})

function formatAmount(amount?: number): string {
  if (amount == null) {
    return ''
  }
  return (amount / 100).toFixed(2)
}

/** 关闭当前窗口(PC 端: window.close, 非 window.open 打开时可能无效, 但作为兜底) */
function handleClose() {
  window.close()
}

onMounted(() => {
  init()
})
</script>

<template>
  <div class="pay-result">
    <div class="pay-result__card">
      <div class="pay-result__icon" :style="{ background: meta.color }">
        <svg v-if="meta.icon === 'check'" viewBox="0 0 48 48" width="32" height="32" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 24 L21 31 L34 16" />
        </svg>
        <svg v-else-if="meta.icon === 'cross'" viewBox="0 0 48 48" width="32" height="32" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 16 L32 32 M32 16 L16 32" />
        </svg>
        <svg v-else-if="meta.icon === 'lock'" viewBox="0 0 48 48" width="32" height="32" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="14" y="22" width="20" height="14" rx="2" />
          <path d="M18 22 V16 a6 6 0 0 1 12 0 V22" />
        </svg>
        <svg v-else-if="meta.icon === 'clock'" viewBox="0 0 48 48" width="32" height="32" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="24" cy="24" r="14" />
          <path d="M24 15 V24 L30 27" />
        </svg>
        <svg v-else-if="meta.icon === 'warning'" viewBox="0 0 48 48" width="32" height="32" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M24 8 L42 38 H6 Z" />
          <path d="M24 19 V28" />
          <circle cx="24" cy="34" r="1.6" fill="#fff" stroke="none" />
        </svg>
        <svg v-else class="pay-result__icon-spin" viewBox="0 0 50 50" width="32" height="32" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round">
          <path d="M25 5 A20 20 0 1 1 5 25" />
        </svg>
      </div>
      <h1 class="pay-result__title" :style="{ color: meta.color }">
        {{ title }}
      </h1>
      <p v-if="tip" class="pay-result__tip">
        {{ tip }}
      </p>
      <div v-if="summaryRows.length" class="pay-result__summary">
        <div v-for="(row, idx) in summaryRows" :key="idx" class="pay-result__summary-row">
          <span class="pay-result__summary-label">{{ row.label }}</span>
          <span class="pay-result__summary-value">{{ row.value }}</span>
        </div>
      </div>
      <p v-if="showRedirect && redirectCountdown > 0" class="pay-result__countdown">
        {{ t('payResult.autoRedirectTip', { n: redirectCountdown }) }}
      </p>
      <button
        v-if="showRedirect"
        class="pay-result__btn pay-result__btn--primary"
        @click="redirectNow"
      >
        {{ t('payResult.backToMerchant') }}
      </button>
      <button
        v-else-if="state !== 'loading'"
        class="pay-result__btn pay-result__btn--default"
        @click="handleClose"
      >
        {{ t('payResult.closePage') }}
      </button>
    </div>
    <!-- 平台备案信息(版权 + ICP + 公网安, 配置为空不渲染) -->
    <BeianFooter class="pay-result__beian" />
  </div>
</template>

<style scoped>
/* PC 端: scoped 原生 px + 媒体查询(AGENTS.md PC 三约束, 禁用 UnoCSS px 原子类) */
.pay-result {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: #f5f7fa;
  box-sizing: border-box;
}

.pay-result__card {
  width: 100%;
  max-width: 420px;
  padding: 40px 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 8%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  box-sizing: border-box;
}

.pay-result__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.pay-result__icon-spin {
  animation: pay-result-spin 1s linear infinite;
}

@keyframes pay-result-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.pay-result__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
}

.pay-result__tip {
  margin: 0;
  font-size: 14px;
  color: #909399;
  line-height: 1.6;
}

.pay-result__summary {
  width: 100%;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
  text-align: left;
}

.pay-result__summary-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 8px 0;
  font-size: 14px;
  line-height: 1.5;
}

.pay-result__summary-label {
  color: #909399;
  flex-shrink: 0;
  min-width: 80px;
}

.pay-result__summary-value {
  color: #303133;
  text-align: right;
  word-break: break-all;
}

.pay-result__countdown {
  margin: 12px 0 0;
  font-size: 13px;
  color: #909399;
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
}

.pay-result__btn {
  margin-top: 24px;
  min-width: 200px;
  padding: 10px 24px;
  font-size: 15px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: opacity 0.2s;
}

.pay-result__btn:hover {
  opacity: 0.85;
}

.pay-result__btn--primary {
  background: #1989fa;
  color: #fff;
  border-color: #1989fa;
}

.pay-result__btn--default {
  background: #fff;
  color: #606266;
  border-color: #dcdfe6;
}

/* 平台备案栏: 固定底部居中(与 PC 首页页脚同模式, 不破坏卡片垂直居中) */
.pay-result__beian {
  position: fixed;
  bottom: 10px;
  left: 0;
  right: 0;
  opacity: 0.75;
}
</style>
