<script lang="ts" setup>
/**
 * 码牌支付 - 成功结果页组件
 *
 * 视觉对齐聚合 AggregateResultCard（上浮卡片 + 实心彩色图标 + border-top 摘要表格），
 * 保留码牌特色：大金额独占行 + 入场动画。
 * 通道品牌色由父级注入（微信绿 / 支付宝蓝），图标/标题/按钮跟随通道色；
 * 近黑色品牌（抖音）在深色下主按钮反色为浅底深字。
 */
import { computed, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDesignSetting } from '@/shared/hooks/setting/useDesignSetting'

defineOptions({ name: 'CodePayResultCard' })

const props = withDefaults(defineProps<{
  /** 大金额（元字符串），独占一行展示 — 码牌特色 */
  amount: string
  /** 标题文案（已 $t，留空走 i18n codePay.paySuccess） */
  title?: string
  /** 副提示文案（已 $t，留空走 i18n codePay.paidTip） */
  tip?: string
  /** 收款商户名 */
  merchantName?: string
  /** 订单号 */
  orderNo?: string
  /** 品牌色（浅色） */
  brandColor?: string
  /** 品牌色（深色模式压亮，空则用 brandColor） */
  brandColorDark?: string
  /** 关闭按钮文案（已 $t，留空走 i18n codePay.closePage） */
  closeText?: string
  /** 是否显示关闭/完成按钮；抖音等无法关 WebView 的环境传 false */
  showClose?: boolean
}>(), {
  title: '',
  tip: '',
  merchantName: '',
  orderNo: '',
  brandColor: '#5d9dfe',
  brandColorDark: '',
  closeText: '',
  showClose: true,
})

const emit = defineEmits<{
  /** 完成/关闭页面（由父级处理 closeWebview） */
  close: []
}>()

const { t } = useI18n()
const { getDarkMode } = useDesignSetting()

/** 近黑色品牌（抖音）：深色下主按钮需浅底深字 */
function isNearBlackBrand(hex?: string) {
  if (!hex) {
    return false
  }
  const h = hex.replace('#', '')
  if (h.length !== 6) {
    return false
  }
  const r = Number.parseInt(h.slice(0, 2), 16)
  const g = Number.parseInt(h.slice(2, 4), 16)
  const b = Number.parseInt(h.slice(4, 6), 16)
  return (r + g + b) / 3 < 60
}

/** 当前生效品牌色（深色优先 brandColorDark，用于图标/标题/按钮） */
const effectiveBrand = computed(() => {
  if (unref(getDarkMode) === 'dark' && props.brandColorDark) {
    return props.brandColorDark
  }
  return props.brandColor
})

/** 操作按钮色：深色 + 近黑品牌时反色为浅底 */
const effectiveAction = computed(() => {
  if (unref(getDarkMode) === 'dark' && isNearBlackBrand(props.brandColor)) {
    return '#f2f2f2'
  }
  return effectiveBrand.value
})

/** 操作按钮文字色 */
const effectiveActionText = computed(() => {
  if (unref(getDarkMode) === 'dark' && isNearBlackBrand(props.brandColor)) {
    return '#161823'
  }
  return '#ffffff'
})

/** 标题（默认走 i18n） */
const titleText = computed(() => props.title || t('codePay.paySuccess'))

/** 副提示（默认走 i18n） */
const tipText = computed(() => props.tip || t('codePay.paidTip'))

/** 关闭按钮文案（默认走 i18n） */
const closeText = computed(() => props.closeText || t('codePay.closePage'))
</script>

<template>
  <div
    class="code-pay-result"
    :style="{
      '--result-color': effectiveBrand,
      '--brand-action': effectiveAction,
      '--brand-action-text': effectiveActionText,
    }"
  >
    <!-- 状态图标：实心彩色圆底 + 白色 SVG（对齐聚合） -->
    <div class="code-pay-result__icon">
      <svg
        viewBox="0 0 48 48"
        width="28"
        height="28"
        fill="none"
        stroke="#fff"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <!-- 对勾 -->
        <path d="M14 24 L21 31 L34 16" />
      </svg>
    </div>
    <!-- 支付成功 -->
    <p class="code-pay-result__title">
      {{ titleText }}
    </p>
    <!-- 副提示 -->
    <p class="code-pay-result__tip">
      {{ tipText }}
    </p>
    <!-- 大金额（码牌特色，独占行） -->
    <div class="code-pay-result__amount">
      <span class="code-pay-result__currency">¥</span>{{ amount }}
    </div>
    <!-- 订单摘要（border-top 分割线表格，对齐聚合） -->
    <div v-if="merchantName || orderNo" class="code-pay-result__summary">
      <div v-if="merchantName" class="code-pay-result__summary-row">
        <!-- 收款商户 -->
        <span class="code-pay-result__summary-label">{{ t('codePay.merchantDefault') }}</span>
        <span class="code-pay-result__summary-value">{{ merchantName }}</span>
      </div>
      <div v-if="orderNo" class="code-pay-result__summary-row">
        <!-- 订单号 -->
        <span class="code-pay-result__summary-label">{{ t('codePay.orderNo') }}</span>
        <span class="code-pay-result__summary-value">{{ orderNo }}</span>
      </div>
    </div>
    <!-- 完成/关闭（抖音等环境无可靠关页 API 时改为提示） -->
    <van-button
      v-if="showClose"
      class="code-pay-result__close"
      round
      block
      type="primary"
      color="var(--brand-action)"
      @click="emit('close')"
    >
      {{ closeText }}
    </van-button>
    <!-- 请点击右上角关闭 -->
    <p v-else class="code-pay-result__close-hint">
      {{ t('common.closeManually') }}
    </p>
  </div>
</template>

<style scoped lang="less">
// 结果状态卡片：上浮卡片风格，对齐聚合 AggregateResultCard
.code-pay-result {
  margin: -32px 16px 16px;
  padding: 24px 20px;
  background: var(--h5-bg-card);
  border-radius: 12px;
  box-shadow: var(--h5-shadow-card);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  box-sizing: border-box;
  animation: code-pay-result-up 0.45s ease-out;
}

// 实心彩色圆底图标（对齐聚合，原 80px 半透明底）
.code-pay-result__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--result-color);
  margin-bottom: 4px;
  flex-shrink: 0;
  animation: code-pay-result-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
}

// 状态标题：跟随通道品牌色（对齐聚合）
.code-pay-result__title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--result-color);
  line-height: 1.4;
}

// 副提示文案
.code-pay-result__tip {
  margin: 0;
  font-size: 13px;
  color: var(--h5-text-secondary);
  line-height: 1.6;
}

// 大金额（码牌特色，独占行）
.code-pay-result__amount {
  font-size: 36px;
  font-weight: 600;
  color: var(--h5-text-primary);
  line-height: 1.2;
  margin: 12px 0 16px;
}

.code-pay-result__currency {
  font-size: 20px;
  margin-right: 4px;
  font-weight: 500;
}

// 订单摘要区：border-top 分割线表格（对齐聚合，原独立阴影卡）
.code-pay-result__summary {
  width: 100%;
  padding-top: 16px;
  border-top: 1px solid var(--h5-border);
  text-align: left;
  box-sizing: border-box;
}

.code-pay-result__summary-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 6px 0;
  font-size: 13px;
  line-height: 1.5;
}

.code-pay-result__summary-label {
  color: var(--h5-text-secondary);
  flex-shrink: 0;
  min-width: 72px;
}

.code-pay-result__summary-value {
  color: var(--h5-text-primary);
  text-align: right;
  word-break: break-all;
}

// 关闭按钮：实心品牌色，对齐聚合 280px
.code-pay-result__close {
  margin-top: 16px;
  width: 100%;
  max-width: 280px;
}

// 无法关 WebView 时的手动关闭提示（如抖音）
.code-pay-result__close-hint {
  margin: 16px 0 0;
  font-size: 13px;
  color: var(--h5-text-secondary);
  line-height: 1.6;
}

@keyframes code-pay-result-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes code-pay-result-pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
