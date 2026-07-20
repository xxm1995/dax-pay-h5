<script lang="ts" setup>
/**
 * 聚合扫码-抖音环境
 * 抖音黑主题（#161823），支付完成无 returnUrl 时自动关闭 webview 回到抖音
 */
import type { AggregateResultState } from '../components/AggregateResultCard.vue'
import { showNotify, showSuccessToast } from 'vant'
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import InitLoadingMask from '@/shared/components/pay/InitLoadingMask.vue'
import QrCodeDisplay from '@/shared/components/pay/QrCodeDisplay.vue'
import { useAggregatePay } from '@/shared/pay/use-aggregate-pay'
import AggregateResultCard from '../components/AggregateResultCard.vue'

defineOptions({ name: 'AggregateDouyinPage' })

// 抖音品牌色（成功态图标用）
const BRAND_COLOR = '#161823'

const { t } = useI18n()
const route = useRoute()
const orderNo = route.params.orderNo as string

const {
  ready,
  paying,
  authorizing,
  loadError,
  order,
  meta,
  payResult,
  showQrcode,
  qrContent,
  amountYuan,
  paid,
  terminal,
  expired,
  countdown,
  remainSeconds,
  bootstrap,
  doPay,
} = useAggregatePay({
  orderNo,
  clientEnv: 'douyin',
  device: 'mobile',
  // 支付完成无 returnUrl 时关闭 webview 回到抖音
  closeOnPaidWithoutReturn: true,
  t,
  onPaid() {
    showSuccessToast(t('aggregate.paid'))
  },
  onError(message) {
    showNotify({ type: 'danger', message })
  },
})

/**
 * InitLoadingMask 阶段文案
 */
const maskTipKey = computed(() => {
  if (authorizing.value) {
    return 'aggregate.authorizing'
  }
  if (paying.value) {
    return 'aggregate.paying'
  }
  return ''
})

/** 终态（非成功）的状态映射，供 AggregateResultCard 渲染 */
const terminalState = computed<AggregateResultState>(() => {
  const s = order.value.status
  if (s === 'closed') {
    return 'closed'
  }
  if (s === 'expired') {
    return 'expired'
  }
  // failed 或兜底
  return 'failed'
})

/** 异常终态：失败/关闭/过期（不含成功）—— 隐藏主卡，订单信息降级为结果卡摘要 */
const abnormalTerminal = computed(() => (terminal.value && !paid.value) || expired.value)

/** 订单摘要（异常终态时传给 AggregateResultCard 展示，对齐 PC 端 summary） */
const orderSummary = computed<Array<{ label: string, value: string }>>(() => {
  const items: Array<{ label: string, value: string }> = []
  if (order.value.title) {
    // 商品标题
    items.push({ label: t('aggregate.orderTitle'), value: order.value.title })
  }
  if (order.value.bizOrderNo) {
    // 商户订单号
    items.push({ label: t('aggregate.bizOrderNo'), value: order.value.bizOrderNo })
  }
  if (order.value.orderNo) {
    // 平台订单号
    items.push({ label: t('aggregate.orderNo'), value: order.value.orderNo })
  }
  if (order.value.amount != null) {
    // 支付金额
    items.push({ label: t('aggregate.amount'), value: `¥${amountYuan.value}` })
  }
  return items
})

onMounted(() => {
  bootstrap()
})
</script>

<template>
  <div class="agg agg--douyin">
    <!-- 初始化/授权/支付中：统一全屏遮罩 -->
    <InitLoadingMask
      v-if="!ready || authorizing || paying"
      :brand-color="BRAND_COLOR"
      :tip-key="maskTipKey"
    />

    <!-- 加载错误：补 brand 色块作为结果卡负 margin 的叠放对象，与其他终态视觉一致 -->
    <template v-else-if="loadError">
      <div class="agg__brand" />
      <AggregateResultCard state="loadError" :message="loadError" />
    </template>

    <template v-else>
      <!-- 顶部品牌色装饰区（半透明圆点缀） -->
      <div class="agg__brand" />

      <!-- 订单信息卡片（终态时隐藏，订单信息降级到结果卡摘要） -->
      <div v-if="!paid && !abnormalTerminal" class="agg__card agg__card--main">
        <div class="agg__title">
          {{ order.title || t('aggregate.defaultTitle') }}
        </div>
        <div class="agg__amount">
          <span class="agg__currency">¥</span>{{ amountYuan }}
        </div>
        <div v-if="order.description" class="agg__desc">
          {{ order.description }}
        </div>
        <div class="agg__meta">
          <div class="agg__meta-row">
            <span>{{ t('aggregate.orderNo') }}</span>
            <span>{{ order.orderNo }}</span>
          </div>
          <div v-if="remainSeconds > 0 && !paid" class="agg__meta-row">
            <span>{{ t('aggregate.countdown') }}</span>
            <span class="agg__countdown">{{ countdown }}</span>
          </div>
        </div>
      </div>

      <!-- 支付成功 -->
      <AggregateResultCard v-if="paid" state="paid" :brand-color="BRAND_COLOR" :summary="orderSummary" />

      <!-- 终态（非支付成功：失败/关闭/过期） -->
      <AggregateResultCard v-else-if="terminal" :state="terminalState" :summary="orderSummary" />

      <!-- 过期（倒计时归零，前端判定） -->
      <AggregateResultCard v-else-if="expired" state="expired" :summary="orderSummary" />

      <!-- 二维码 -->
      <div v-else-if="showQrcode && qrContent" class="agg__card">
        <p class="agg__tip">
          {{ t('aggregate.scanQr') }}
        </p>
        <div class="agg__qr">
          <QrCodeDisplay :content="qrContent" :size="200" />
        </div>
      </div>

      <!-- 其他支付方式（link/jsapi 以外的提示） -->
      <div
        v-else-if="payResult?.payBody && payResult.payBodyType !== 'link' && payResult.payBodyType !== 'jsapi'"
        class="agg__card"
      >
        <div class="agg__pay-tip">
          {{ t('aggregate.useAppPay') }}
        </div>
      </div>

      <!-- 支付按钮 -->
      <div v-if="!paid && !terminal && !expired" class="agg__actions">
        <van-button
          type="primary"
          round
          block
          :loading="paying || authorizing"
          @click="doPay"
        >
          {{ paying ? t('aggregate.paying') : (meta.autoLaunch ? t('aggregate.retry') : t('aggregate.payNow')) }}
        </van-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* 抖音黑主题色：浅色原色；深色顶栏略提亮；操作按钮反色保证可读 */
.agg--douyin {
  --agg-brand: #161823;
  --agg-brand-deep: #2b2b3a;
  /* 操作按钮色（可与顶栏品牌分离） */
  --agg-action: #161823;
  --agg-action-text: #ffffff;
  --van-button-primary-background: var(--agg-action);
  --van-button-primary-border-color: var(--agg-action);
  --van-button-primary-color: var(--agg-action-text);
  --van-loading-text-color: var(--agg-brand);
  --van-nav-bar-icon-color: var(--agg-brand);
  --van-nav-bar-text-color: var(--agg-brand);
}

/* 深色：顶栏仍偏深；主按钮改浅底深字，避免黑钮融进卡片 */
html.dark .agg--douyin {
  --agg-brand: #2a2a32;
  --agg-brand-deep: #1a1a22;
  --agg-action: #f2f2f2;
  --agg-action-text: #161823;
  --van-loading-text-color: #e5e5e5;
  --van-nav-bar-icon-color: #e5e5e5;
  --van-nav-bar-text-color: #e5e5e5;
}

.agg {
  min-height: 100%;
  padding-bottom: 40px;
  background: var(--h5-bg-page);
}

.agg--douyin .agg__brand {
  background:
    radial-gradient(circle 60px at calc(100% - 15px) 8px, rgb(255 255 255 / 42%), transparent 100%),
    radial-gradient(circle 38px at 22px 48px, rgb(255 255 255 / 30%), transparent 100%),
    radial-gradient(circle 28px at 58% 12px, rgb(255 255 255 / 24%), transparent 100%),
    linear-gradient(135deg, var(--agg-brand), var(--agg-brand-deep));
}

.agg__brand {
  height: 130px;
  padding: 0;
  overflow: hidden;
  color: #fff;
}

.agg__card {
  margin: -32px 16px 16px;
  padding: 24px 20px;
  background: var(--h5-bg-card);
  border-radius: 12px;
  box-shadow: var(--h5-shadow-card);
  text-align: center;
}

.agg__card--loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.agg__card--main {
  margin-top: -32px;
}

.agg__title {
  font-size: 16px;
  color: var(--h5-text-primary);
  margin-bottom: 12px;
}

.agg__amount {
  font-size: 36px;
  font-weight: 600;
  color: var(--h5-text-primary);
  line-height: 1.2;
}

.agg__currency {
  font-size: 20px;
  margin-right: 4px;
}

.agg__desc {
  margin-top: 8px;
  font-size: 13px;
  color: var(--h5-text-secondary);
}

.agg__meta {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--h5-border);
  font-size: 12px;
  color: var(--h5-text-secondary);
  text-align: left;
}

.agg__meta-row {
  display: flex;
  justify-content: space-between;
  line-height: 1.8;
}

.agg__countdown {
  color: var(--agg-brand);
  font-variant-numeric: tabular-nums;
}

html.dark .agg--douyin .agg__countdown {
  color: var(--h5-text-primary);
}

.agg__tip,
.agg__pay-tip {
  font-size: 14px;
  color: var(--h5-text-secondary);
  margin: 8px 0;
}

.agg__qr {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

.agg__actions {
  margin: 0 16px;
}
</style>
