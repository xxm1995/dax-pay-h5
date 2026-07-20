<script lang="ts">
/**
 * 聚合扫码 - 结果状态卡片类型定义
 * 供 4 个聚合环境页（wechat/alipay/union-pay/douyin）的 terminalState computed 复用
 */
// 终态类型：成功 / 失败 / 关闭 / 过期 / 加载失败
</script>

<script lang="ts" setup>
/**
 * 聚合扫码 - 结果状态卡片
 * 统一展示支付终态：成功 / 失败 / 关闭 / 过期 / 加载失败
 * 图标 + 颜色 + 标题 + 副提示，与 PC 端视觉语言对齐（见 pc/views/aggregate/Index.vue resultMeta）
 * 4 个聚合环境页共用；成功色优先继承父级 --agg-brand（深色已压亮）
 *
 * 成功态（state='paid'）特殊处理：
 *  - 有 returnUrl：显示倒计时提示 + 「返回商户」按钮，倒计时归零自动 emit('redirect')
 *  - 无 returnUrl：保持「关闭页面」按钮，由用户点击关闭 webview
 */
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { closeWebview } from '@/shared/pay/close-webview'

export type AggregateResultState = 'paid' | 'failed' | 'closed' | 'expired' | 'loadError'

defineOptions({ name: 'AggregateResultCard' })

const props = withDefaults(defineProps<{
  // 终态类型
  state: AggregateResultState
  // 成功态品牌色兜底（优先 CSS var(--agg-brand)）
  brandColor?: string
  // 加载失败时的动态消息（覆盖默认标题文案）
  message?: string
  // 订单摘要项（可选）：终态时附属在副提示下方，展示订单关键信息（对齐 PC 端 summary）
  summary?: Array<{ label: string, value: string }>
  // 商户回跳地址：仅成功态生效，有值时显示「返回商户」+ 倒计时自动跳转
  returnUrl?: string
  // 成功态倒计时秒数（有 returnUrl 时生效），默认 3
  countdownSeconds?: number
}>(), {
  countdownSeconds: 3,
})

const emit = defineEmits<{
  // 成功态用户点击「返回商户」或倒计时归零时触发，由端页调用 redirectIfNeeded()
  redirect: []
}>()

const { t } = useI18n()

/** 图标类型 */
type IconName = 'check' | 'cross' | 'lock' | 'clock' | 'warning'

/** 状态元数据：颜色 / 图标 / 标题key / 副提示key */
const meta = computed<{ color: string, icon: IconName, titleKey: string, tipKey: string }>(() => {
  switch (props.state) {
    case 'paid':
      // 成功：继承父级 --agg-brand（深色已压亮），无则微信绿兜底
      return { color: 'var(--agg-brand, #07c160)', icon: 'check', titleKey: 'aggregate.paid', tipKey: 'aggregate.paidTip' }
    case 'failed':
      return { color: '#ee0a24', icon: 'cross', titleKey: 'aggregate.failed', tipKey: 'aggregate.failedTip' }
    case 'closed':
      return { color: '#fa8c16', icon: 'lock', titleKey: 'aggregate.closed', tipKey: 'aggregate.closedTip' }
    case 'expired':
      return { color: '#969799', icon: 'clock', titleKey: 'aggregate.expired', tipKey: 'aggregate.expiredTip' }
    case 'loadError':
      return { color: '#fa8c16', icon: 'warning', titleKey: 'aggregate.loadFail', tipKey: 'aggregate.loadFailTip' }
    // 兜底（理论上不会到达，保证 computed 始终有返回值）
    default:
      return { color: '#ee0a24', icon: 'cross', titleKey: 'aggregate.failed', tipKey: 'aggregate.failedTip' }
  }
})

/** 标题：始终使用固定文案（主标题写死，与码牌/收银台风格统一） */
const title = computed(() => t(meta.value.titleKey))

/** 副提示：loadError 态显示后端返回的具体原因（无消息则不渲染副标题）；其他态用固定 tipKey */
const tip = computed(() => {
  if (props.state === 'loadError') {
    return props.message || ''
  }
  return t(meta.value.tipKey)
})

/** 是否为带 returnUrl 的成功态（显示倒计时 + 返回商户按钮） */
const showRedirect = computed(() => props.state === 'paid' && !!props.returnUrl)

/** 自动跳转倒计时（仅 showRedirect 时启动） */
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (!showRedirect.value) {
    return
  }
  countdown.value = props.countdownSeconds
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      emit('redirect')
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

/** 关闭宿主 WebView / 窗口 */
function handleClose() {
  closeWebview()
}
</script>

<template>
  <div class="agg-result" :style="{ '--agg-result-color': meta.color }">
    <!-- 状态图标：彩色圆底 + 白色 SVG -->
    <div class="agg-result__icon">
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
        <!-- 成功：对勾 -->
        <template v-if="meta.icon === 'check'">
          <path d="M14 24 L21 31 L34 16" />
        </template>
        <!-- 失败：叉 -->
        <template v-else-if="meta.icon === 'cross'">
          <path d="M16 16 L32 32 M32 16 L16 32" />
        </template>
        <!-- 关闭：锁 -->
        <template v-else-if="meta.icon === 'lock'">
          <rect x="14" y="22" width="20" height="14" rx="2" stroke-width="3.5" />
          <path d="M18 22 V16 a6 6 0 0 1 12 0 V22" stroke-width="3.5" />
        </template>
        <!-- 过期：时钟 -->
        <template v-else-if="meta.icon === 'clock'">
          <circle cx="24" cy="24" r="14" stroke-width="3.5" />
          <path d="M24 15 V24 L30 27" stroke-width="3.5" />
        </template>
        <!-- 加载失败：警告三角 -->
        <template v-else>
          <path d="M24 8 L42 38 H6 Z" stroke-width="3.5" />
          <path d="M24 19 V28" />
          <circle cx="24" cy="34" r="1.6" fill="#fff" stroke="none" />
        </template>
      </svg>
    </div>
    <!-- 状态标题 -->
    <p class="agg-result__title">
      {{ title }}
    </p>
    <!-- 副提示：loadError 态显示后端返回的具体原因，无消息时不渲染 -->
    <p v-if="tip" class="agg-result__tip">
      {{ tip }}
    </p>
    <!-- 订单摘要（终态时展示订单关键信息，对齐 PC 端 summary） -->
    <div v-if="summary && summary.length" class="agg-result__summary">
      <div v-for="(item, index) in summary" :key="index" class="agg-result__summary-row">
        <span class="agg-result__summary-label">{{ item.label }}</span>
        <span class="agg-result__summary-value">{{ item.value }}</span>
      </div>
    </div>
    <!-- 自动跳转倒计时（仅成功态 + 有 returnUrl） -->
    <p v-if="showRedirect && countdown > 0" class="agg-result__countdown">
      {{ t('aggregate.autoRedirectTip', { n: countdown }) }}
    </p>
    <!-- 成功态有 returnUrl：显示「返回商户」按钮（用户可立即跳转，不等倒计时） -->
    <van-button
      v-if="showRedirect"
      class="agg-result__close"
      round
      block
      type="primary"
      @click="emit('redirect')"
    >
      {{ t('aggregate.backToMerchant') }}
    </van-button>
    <!-- 其他情况：关闭页面按钮 -->
    <van-button
      v-else
      class="agg-result__close"
      round
      block
      type="primary"
      @click="handleClose"
    >
      {{ t('aggregate.closePage') }}
    </van-button>
  </div>
</template>

<style scoped>
/* 结果状态卡片：自包含样式，与 .agg__card 视觉一致（白底圆角阴影） */
.agg-result {
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
}

/* 彩色圆形图标底 */
.agg-result__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--agg-result-color);
  margin-bottom: 4px;
  flex-shrink: 0;
}

/* 状态标题 */
.agg-result__title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--agg-result-color);
  line-height: 1.4;
}

/* 副提示文案 */
.agg-result__tip {
  margin: 0;
  font-size: 13px;
  color: var(--h5-text-secondary);
  line-height: 1.6;
}

/* 订单摘要区：终态时附属在副提示下方，左右对齐的表格式信息（对齐 PC 端） */
.agg-result__summary {
  width: 100%;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--h5-border);
  text-align: left;
  box-sizing: border-box;
}

.agg-result__summary-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 6px 0;
  font-size: 13px;
  line-height: 1.5;
}

.agg-result__summary-label {
  color: var(--h5-text-secondary);
  flex-shrink: 0;
  min-width: 72px;
}

.agg-result__summary-value {
  color: var(--h5-text-primary);
  text-align: right;
  word-break: break-all;
}

/* 自动跳转倒计时提示（仅成功 + returnUrl） */
.agg-result__countdown {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--h5-text-secondary);
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
}

/* 关闭：实心操作色（优先 --agg-action，兼容仅有 --agg-brand 的通道） */
.agg-result__close {
  margin-top: 16px;
  width: 100%;
  max-width: 280px;
  --van-button-primary-background: var(--agg-action, var(--agg-brand, var(--h5-brand-cashier)));
  --van-button-primary-border-color: var(--agg-action, var(--agg-brand, var(--h5-brand-cashier)));
  --van-button-primary-color: var(--agg-action-text, #fff);
  color: var(--agg-action-text, #fff);
  font-weight: 600;
}
</style>
