<script lang="ts" setup>
/**
 * 支付结果页(移动端)
 *
 * 通道同步回跳(支付宝 return_url)与 jsapi 终态统一入口。
 * 凭 tradeNo 查订单状态: 支付成功 + 有 returnUrl 则倒计时带签名跳转, 否则展示结果结束页。
 */
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { usePayResult } from '@/shared/hooks/use-pay-result'
import { closeWebview } from '@/shared/pay/close-webview'

const route = useRoute()
const { t } = useI18n()

// 路由 param 拿 tradeNo(支付宝回跳时 path 保留, query 签名参数忽略)
const tradeNo = computed(() => route.params.tradeNo as string)
const { result, state, errorMessage, redirectCountdown, isReentry, init, redirectNow } = usePayResult(tradeNo.value)

/** 图标类型 */
type IconName = 'check' | 'cross' | 'lock' | 'clock' | 'warning' | 'loading'

/** 状态元数据: 颜色/图标/标题key/副提示key */
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
      // loading: 初始加载 / 支付处理中(wait_pay/paying 非终态轮询)
      return { color: '#1989fa', icon: 'loading', titleKey: 'payResult.processing', tipKey: '' }
  }
})

const title = computed(() => t(meta.value.titleKey))
const tip = computed(() => {
  if (state.value === 'loadError') {
    // 加载失败时显示后端返回的具体原因, 无则回退固定提示
    return errorMessage.value || t('payResult.loadFailTip')
  }
  return meta.value.tipKey ? t(meta.value.tipKey) : ''
})

/** 是否展示「返回商户」+ 倒计时(仅 paid + 有签名 redirectUrl + 非重入态; 重入态走「关闭页面」) */
const showRedirect = computed(() => state.value === 'paid' && !!result.value.redirectUrl && !isReentry.value)

/** 订单摘要行(终态时展示) */
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

/** 金额格式化(分 → 元, 两位小数) */
function formatAmount(amount?: number): string {
  if (amount == null) {
    return ''
  }
  return (amount / 100).toFixed(2)
}

/** 关闭宿主 WebView / 窗口 */
function handleClose() {
  closeWebview()
}

onMounted(() => {
  init()
})
</script>

<template>
  <div class="pay-result">
    <div class="pay-result__card">
      <!-- 状态图标 -->
      <div class="pay-result__icon" :style="{ background: meta.color }">
        <!-- 成功: 对勾 -->
        <svg v-if="meta.icon === 'check'" viewBox="0 0 48 48" width="28" height="28" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 24 L21 31 L34 16" />
        </svg>
        <!-- 失败: 叉 -->
        <svg v-else-if="meta.icon === 'cross'" viewBox="0 0 48 48" width="28" height="28" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M16 16 L32 32 M32 16 L16 32" />
        </svg>
        <!-- 关闭: 锁 -->
        <svg v-else-if="meta.icon === 'lock'" viewBox="0 0 48 48" width="28" height="28" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="14" y="22" width="20" height="14" rx="2" />
          <path d="M18 22 V16 a6 6 0 0 1 12 0 V22" />
        </svg>
        <!-- 过期: 时钟 -->
        <svg v-else-if="meta.icon === 'clock'" viewBox="0 0 48 48" width="28" height="28" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="24" cy="24" r="14" />
          <path d="M24 15 V24 L30 27" />
        </svg>
        <!-- 加载失败: 警告三角 -->
        <svg v-else-if="meta.icon === 'warning'" viewBox="0 0 48 48" width="28" height="28" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M24 8 L42 38 H6 Z" />
          <path d="M24 19 V28" />
          <circle cx="24" cy="34" r="1.6" fill="#fff" stroke="none" />
        </svg>
        <!-- 加载中: 旋转圆环 -->
        <svg v-else class="pay-result__icon-spin" viewBox="0 0 50 50" width="28" height="28" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round">
          <path d="M25 5 A20 20 0 1 1 5 25" />
        </svg>
      </div>
      <!-- 状态标题 -->
      <p class="pay-result__title" :style="{ color: meta.color }">
        {{ title }}
      </p>
      <!-- 副提示 -->
      <p v-if="tip" class="pay-result__tip">
        {{ tip }}
      </p>
      <!-- 订单摘要 -->
      <div v-if="summaryRows.length" class="pay-result__summary">
        <div v-for="(row, idx) in summaryRows" :key="idx" class="pay-result__summary-row">
          <span class="pay-result__summary-label">{{ row.label }}</span>
          <span class="pay-result__summary-value">{{ row.value }}</span>
        </div>
      </div>
      <!-- 自动跳转倒计时(仅 paid + 有 returnUrl) -->
      <p v-if="showRedirect && redirectCountdown > 0" class="pay-result__countdown">
        {{ t('payResult.autoRedirectTip', { n: redirectCountdown }) }}
      </p>
      <!-- 返回商户按钮(paid + 有 returnUrl) -->
      <van-button
        v-if="showRedirect"
        class="pay-result__btn"
        round block type="primary"
        @click="redirectNow"
      >
        {{ t('payResult.backToMerchant') }}
      </van-button>
      <!-- 关闭页面按钮(其余终态) -->
      <van-button
        v-else-if="state !== 'loading'"
        class="pay-result__btn"
        round block type="primary"
        @click="handleClose"
      >
        {{ t('payResult.closePage') }}
      </van-button>
    </div>
  </div>
</template>

<style scoped>
/* 结果页根容器: 不设 min-height:100vh(AGENTS.md 移动端硬规则), 灰底由 App.vue 全局提供 */
.pay-result {
  padding: 48px 16px 16px;
}

/* 结果卡片: 白底圆角阴影, 与收银台/聚合结果卡视觉一致 */
.pay-result__card {
  padding: 24px 20px;
  background: var(--h5-bg-card, #fff);
  border-radius: 12px;
  box-shadow: var(--h5-shadow-card, 0 4rpx 16rpx rgb(0 0 0 / 6%));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

/* 彩色圆形图标底 */
.pay-result__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  flex-shrink: 0;
}

/* 加载中图标旋转动画 */
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

/* 状态标题 */
.pay-result__title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;
}

/* 副提示文案 */
.pay-result__tip {
  margin: 0;
  font-size: 13px;
  color: var(--h5-text-secondary, #969799);
  line-height: 1.6;
}

/* 订单摘要区 */
.pay-result__summary {
  width: 100%;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--h5-border, #ebedf0);
  text-align: left;
}

.pay-result__summary-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 6px 0;
  font-size: 13px;
  line-height: 1.5;
}

.pay-result__summary-label {
  color: var(--h5-text-secondary, #969799);
  flex-shrink: 0;
  min-width: 72px;
}

.pay-result__summary-value {
  color: var(--h5-text-primary, #323233);
  text-align: right;
  word-break: break-all;
}

/* 倒计时提示 */
.pay-result__countdown {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--h5-text-secondary, #969799);
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
}

/* 操作按钮 */
.pay-result__btn {
  margin-top: 16px;
  width: 100%;
  max-width: 280px;
}
</style>
