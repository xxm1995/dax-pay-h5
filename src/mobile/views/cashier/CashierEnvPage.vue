<script lang="ts" setup>
/**
 * H5 收银台环境页：路径中的 clientEnv 即配置分桶
 * 负责订单展示、支付项选择、发起支付与 payBody 分发
 */
import type { CashierItemPublic, GatewayOrderInfo } from '@/shared/api/gateway'
import { showNotify, showSuccessToast } from 'vant'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  cashierPay,
  generateGatewayAuthUrl,
  getGatewayOrder,
  listCashierItems,
} from '@/shared/api/gateway'
import InitLoadingMask from '@/shared/components/pay/InitLoadingMask.vue'
import PayMethodIcon from '@/shared/components/pay/PayMethodIcon.vue'
import QrCodeDisplay from '@/shared/components/pay/QrCodeDisplay.vue'
import { useGatewayOrderPoll } from '@/shared/hooks/use-gateway-order-poll'
import { closeWebview } from '@/shared/pay/close-webview'
import { detectClientEnv, isValidH5ClientEnv } from '@/shared/utils/client-env'
import { cacheOrder, clearCachedOrder, getCachedOrder } from '@/shared/utils/order-cache'
import { fenToYuan } from '@/shared/utils/pay-amount'
import { invokeJsapiByEnv } from '@/shared/utils/pay-jsapi'
import {
  clientEnvNeedsOpenId,
  clientEnvToAuthType,
  getPayOpenId,
} from '@/shared/utils/pay-openid'
import {
  redirectToPayUrl,
  resolvePayResult,
  submitPayForm,
} from '@/shared/utils/pay-result'

defineOptions({ name: 'CashierEnvPage' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const orderNo = route.params.orderNo as string
const clientEnvParam = route.params.clientEnv as string

const loading = ref(true)
// 业务内容是否可渲染（与 loading 分离）：ready=false 期间由 InitLoadingMask 接管视觉
const ready = ref(false)
const paying = ref(false)
const loadError = ref('')
const order = ref<GatewayOrderInfo>({})
const payMethods = ref<CashierItemPublic[]>([])
const selectId = ref<string>('')
const showQrcode = ref(false)
const qrContent = ref('')

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
    showSuccessToast(t('cashier.paid'))
    redirectIfNeeded()
  },
})

/**
 * 支付项展示名
 */
function methodName(item: CashierItemPublic) {
  if (item.name) {
    return item.name
  }
  const icon = item.icon || 'wechat'
  const key = `cashier.method.${icon}`
  const label = t(key)
  return label === key ? icon : label
}

/**
 * 支付成功后跳转商户 returnUrl
 */
function redirectIfNeeded() {
  if (order.value.returnUrl) {
    setTimeout(() => {
      window.location.href = order.value.returnUrl!
    }, 1200)
  }
}

/**
 * 启动过期倒计时
 */
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
 * UA 与路径 clientEnv 不一致时踢回入口重分流
 */
function guardClientEnv(): boolean {
  if (!isValidH5ClientEnv(clientEnvParam)) {
    router.replace({ name: 'CashierEntry', params: { orderNo } })
    return false
  }
  const actual = detectClientEnv()
  if (actual !== clientEnvParam) {
    router.replace({ name: 'CashierEntry', params: { orderNo } })
    return false
  }
  return true
}

/**
 * 加载订单 + 支付项；支持授权回跳 autoPay
 *
 * ready 控制：autoPay 触发时保持 ready=false 让遮罩持续到 pay() 结束，
 * 避免订单卡闪现后立刻进入支付态
 */
async function loadPage() {
  if (!guardClientEnv()) {
    return
  }
  loading.value = true
  ready.value = false
  loadError.value = ''
  // OAuth 回跳后先从 sessionStorage 缓存恢复订单，减少白屏时间
  const cached = getCachedOrder<GatewayOrderInfo>(orderNo)
  if (cached) {
    order.value = cached
  }
  try {
    order.value = await getGatewayOrder(orderNo)
    // 写入缓存，OAuth 跳转回跳时可快速恢复
    cacheOrder(orderNo, order.value)
    startCountdown(order.value.expiredTime)
    // 仅可支付订单（非终态）请求支付项，避免对已关闭/失败/过期订单触发后端拦截异常
    if (!isTerminal.value) {
      // clientEnv 来自路径，与运营端 H5 分桶对齐
      payMethods.value = await listCashierItems({
        orderNo,
        cashierType: 'h5',
        clientEnv: clientEnvParam,
      })
      // 授权回跳可带 itemId；否则推荐项/首项
      const qItemId = route.query.itemId as string | undefined
      if (qItemId && payMethods.value.some(i => i.id === qItemId)) {
        selectId.value = qItemId
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
  // 授权成功回跳后自动继续支付：保持 ready=false 让遮罩持续到支付发起
  if (!isTerminal.value && !loadError.value && route.query.autoPay === '1' && selectId.value) {
    await pay()
  }
  // 支付未触发或已结束（未跳走）：渲染业务内容
  ready.value = true
}

/**
 * 当前选中支付项是否需要 openId
 *
 * 优先读后端返回的 item.needOpenId（基于 method + clientEnv + openId 黑名单综合判定）;
 * 旧后端无此字段时降级到 clientEnv 硬编码（wechat/alipay/douyin → true）。
 */
function selectedItemNeedsOpenId(): boolean {
  const selected = payMethods.value.find(i => i.id === selectId.value)
  if (selected?.needOpenId !== undefined) {
    return !!selected.needOpenId
  }
  return clientEnvNeedsOpenId(clientEnvParam)
}

/**
 * 需要 openId 时跳转 OAuth；returnPath 带回环境页并 autoPay
 */
async function ensureOpenIdOrRedirect(): Promise<string | null> {
  if (!selectedItemNeedsOpenId()) {
    return getPayOpenId(orderNo, clientEnvParam) || null
  }
  const existing = getPayOpenId(orderNo, clientEnvParam)
  if (existing) {
    return existing
  }
  const authType = clientEnvToAuthType(clientEnvParam)
  if (!authType) {
    return null
  }
  // returnPath 含 itemId + autoPay, 授权完成后自动继续支付
  const returnPath = `/cashier/${encodeURIComponent(orderNo)}/${clientEnvParam}?itemId=${encodeURIComponent(selectId.value)}&autoPay=1`
  const auth = await generateGatewayAuthUrl({
    orderNo,
    authType,
    returnPath,
  })
  if (!auth?.authUrl) {
    throw new Error(t('cashier.authUrlFail'))
  }
  window.location.href = auth.authUrl
  return null
}

/**
 * 处理 JSAPI 调起结果
 */
async function handleJsapi(payload: string) {
  const status = await invokeJsapiByEnv(clientEnvParam, payload)
  if (status === 'ok') {
    order.value.status = 'paid'
    showSuccessToast(t('cashier.paid'))
    redirectIfNeeded()
    return
  }
  if (status === 'cancel') {
    showNotify({ type: 'warning', message: t('cashier.payCancel') })
    return
  }
  if (status === 'unsupported') {
    showNotify({ type: 'warning', message: t('cashier.jsapiPending') })
    startPoll(orderNo)
    return
  }
  showNotify({ type: 'danger', message: t('cashier.payFail') })
  startPoll(orderNo)
}

/**
 * 发起收银台支付
 */
async function pay() {
  if (paying.value || paid.value || !selectId.value || expired.value) {
    return
  }
  paying.value = true
  showQrcode.value = false
  qrContent.value = ''
  try {
    // 选中项需要 openId 时(微信/支付宝/抖音环境或后端标记 needOpenId)跳转授权
    let openId: string | undefined
    if (selectedItemNeedsOpenId()) {
      const id = await ensureOpenIdOrRedirect()
      if (id == null) {
        // 已跳转 OAuth 或无需继续
        return
      }
      openId = id
    }
    const result = await cashierPay({
      orderNo,
      itemId: selectId.value,
      cashierType: 'h5',
      clientEnv: clientEnvParam,
      device: 'mobile',
      openId,
    })
    const action = resolvePayResult(result)
    switch (action.type) {
      case 'success':
        order.value.status = 'paid'
        // 支付成功后订单状态已变，清除缓存避免回显未付态
        clearCachedOrder(orderNo)
        showSuccessToast(t('cashier.paid'))
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
        await handleJsapi(action.payload)
        break
      case 'unsupported':
        showNotify({ type: 'warning', message: t('cashier.payLaunched') })
        startPoll(orderNo)
        break
      case 'poll':
      default:
        startPoll(orderNo)
        break
    }
  }
  catch (e: any) {
    showNotify({ type: 'danger', message: e?.message || t('cashier.payFail') })
  }
  finally {
    paying.value = false
  }
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
  <div class="cashier">
    <!-- 初始化/支付中：统一全屏遮罩，避免业务内容闪现（含 OAuth 回跳 autoPay 自动支付） -->
    <InitLoadingMask
      v-if="!ready || paying"
      :tip-key="paying ? 'cashier.paying' : ''"
    />

    <!-- 结果态：订单已关闭/支付失败/已过期/加载失败 -->
    <div v-else-if="resultState" class="cashier__result">
      <div
        class="cashier__result-icon"
        :style="{ color: resultMeta.color, background: `${resultMeta.color}1a` }"
      >
        <van-icon :name="resultMeta.icon" size="56" />
      </div>
      <div class="cashier__result-title">
        {{ t(resultMeta.titleKey) }}
      </div>
      <div class="cashier__result-subtitle">
        {{ resultState === 'loadError' ? (loadError || t(resultMeta.tipKey)) : t(resultMeta.tipKey) }}
      </div>
      <!-- 订单信息卡片 -->
      <div v-if="order.orderNo" class="cashier__result-order">
        <div class="cashier__result-order-row">
          <span>{{ t('cashier.orderTitle') }}</span>
          <span :title="order.title || t('cashier.demoOrderTitle')">{{ order.title || t('cashier.demoOrderTitle') }}</span>
        </div>
        <div class="cashier__result-order-row">
          <span>{{ t('cashier.orderNo') }}</span>
          <span :title="order.orderNo">{{ order.orderNo }}</span>
        </div>
        <div v-if="order.amount" class="cashier__result-order-row">
          <span>{{ t('cashier.payableAmount') }}</span>
          <span class="cashier__result-amount">￥{{ amountYuan }}</span>
        </div>
      </div>
      <button class="cashier__result-btn" @click="closeWebview">
        {{ t('cashier.closePage') }}
      </button>
    </div>

    <template v-else>
      <!-- 顶部订单信息 -->
      <div class="cashier__header enter-y">
        <div class="cashier__price">
          <span class="cashier__currency">￥</span>
          <span class="cashier__amount">{{ amountYuan }}</span>
        </div>
        <div v-if="remainSeconds > 0 && !paid" class="cashier__countdown">
          <span class="cashier__countdown-label">{{ t('cashier.remainTime') }}</span>
          <span class="cashier__countdown-time">
            {{ countdown.h }}:{{ countdown.m }}:{{ countdown.s }}
          </span>
        </div>
        <div v-else-if="expired" class="cashier__countdown cashier__countdown--expired">
          <span class="cashier__countdown-label">{{ t('cashier.expired') }}</span>
        </div>
        <div class="cashier__detail">
          <div class="cashier__detail-row">
            <span>{{ t('cashier.orderTitle') }}</span>
            <!-- title 便于长文案悬停/长按看全量 -->
            <span :title="order.title || t('cashier.demoOrderTitle')">{{ order.title || t('cashier.demoOrderTitle') }}</span>
          </div>
          <div class="cashier__detail-row">
            <span>{{ t('cashier.orderNo') }}</span>
            <span :title="order.orderNo">{{ order.orderNo }}</span>
          </div>
        </div>
      </div>

      <!-- 已支付 -->
      <div v-if="paid" class="cashier__body enter-y">
        <div class="cashier__section-title">
          {{ t('cashier.paid') }}
        </div>
      </div>

      <!-- 二维码支付 -->
      <div v-else-if="showQrcode" class="cashier__body enter-y">
        <div class="cashier__section-title">
          {{ t('cashier.qrcodePay') }}
        </div>
        <div class="cashier__qrcode">
          <QrCodeDisplay :content="qrContent" :size="200" />
          <p class="cashier__qrcode-tip">
            {{ t('cashier.qrcodeTip', { name: methodName(payMethods.find(i => i.id === selectId) || { id: '' }) }) }}
          </p>
        </div>
      </div>

      <!-- 支付方式选择 -->
      <div v-else class="cashier__body enter-y">
        <div class="cashier__section-title">
          {{ t('cashier.selectMethod') }}
        </div>
        <div v-if="!payMethods.length" class="cashier__empty">
          {{ t('cashier.emptyItems') }}
        </div>
        <div v-else class="cashier__list">
          <div
            v-for="item in payMethods"
            :key="item.id"
            class="cashier__item"
            :class="{ 'cashier__item--active': item.id === selectId }"
            @click="selectId = item.id"
          >
            <div class="cashier__item-info">
              <!-- 品牌 SVG 图标，略大于默认以提升可识别度 -->
              <PayMethodIcon :icon="item.icon" :size="28" />
              <div class="cashier__pay-name">
                {{ methodName(item) }}
                <span v-if="item.recommend" class="cashier__recommend">{{ t('cashier.recommend') }}</span>
              </div>
            </div>
            <div class="cashier__radio" :class="{ 'cashier__radio--checked': item.id === selectId }" />
          </div>
        </div>
      </div>

      <!-- 底部支付按钮 -->
      <div v-if="!paid && !showQrcode" class="cashier__footer enter-y">
        <button
          class="cashier__pay-btn"
          :disabled="paying || !selectId || expired"
          @click="pay"
        >
          {{ paying ? t('cashier.paying') : `${t('cashier.payNow')} ￥${amountYuan}` }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="less">
@primary: var(--h5-brand-cashier);
@primary-dark: var(--h5-brand-cashier-deep);
@danger: #ff4d4f;

.cashier {
  // 三区布局: header 固定 / 中间滚动 / footer 贴底，矮屏不压按钮
  height: 100vh;
  height: 100dvh;
  max-height: 100vh;
  max-height: 100dvh;
  background: var(--h5-bg-page);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  &__error {
    color: @danger;
    font-size: 14px;
    padding: 24px;
    text-align: center;
  }

  &__empty {
    color: var(--h5-text-secondary);
    font-size: 14px;
    text-align: center;
    padding: 24px 0;
  }

  &__result {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 24px calc(24px + env(safe-area-inset-bottom, 0px));
    text-align: center;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    animation: cashier-result-up 0.5s ease-out;
  }

  &__result-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-bottom: 24px;
    animation: cashier-result-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &__result-title {
    font-size: 22px;
    font-weight: 600;
    color: var(--h5-text-primary);
    margin-bottom: 8px;
  }

  &__result-subtitle {
    font-size: 14px;
    color: var(--h5-text-secondary);
    line-height: 1.6;
    max-width: 280px;
  }

  &__result-order {
    width: 100%;
    max-width: 320px;
    margin-top: 24px;
    padding: 16px 20px;
    background: var(--h5-bg-card);
    border-radius: 12px;
    box-shadow: var(--h5-shadow-card);
  }

  &__result-order-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
    }

    span:first-child {
      flex-shrink: 0;
      color: var(--h5-text-secondary);
    }

    span:last-child {
      flex: 1;
      min-width: 0;
      color: var(--h5-text-primary);
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  // 金额红：与 PC 一致，比品牌蓝更醒目
  &__result-amount {
    color: @danger;
    font-weight: 600;
  }

  &__result-btn {
    // 流式底栏，不再 fixed，避免被内容遮挡
    margin-top: 32px;
    width: 100%;
    max-width: 320px;
    height: 48px;
    background: linear-gradient(135deg, @primary 0%, @primary-dark 100%);
    color: #fff;
    border: none;
    border-radius: 100px;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(93, 157, 254, 0.3);
    flex-shrink: 0;

    &:active {
      opacity: 0.9;
      transform: scale(0.98);
    }
  }

  &__header {
    flex-shrink: 0;
    background: linear-gradient(180deg, var(--h5-bg-brand-soft) 0%, var(--h5-bg-card) 100%);
    padding: 24px 20px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: var(--h5-shadow-card);
  }

  // 应付金额用红色，主按钮保持品牌蓝，信息层级更清晰
  &__price {
    display: flex;
    align-items: baseline;
    color: @danger;
    margin-bottom: 8px;
  }

  &__currency {
    font-size: 20px;
    font-weight: 600;
  }

  &__amount {
    font-size: 44px;
    font-weight: 800;
    letter-spacing: -1px;
    text-shadow: 0 2px 8px rgba(255, 77, 79, 0.15);
  }

  // 倒计时用橙：与金额红区分（红=应付 / 橙=时限 / 蓝=操作）
  &__countdown {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    background: var(--h5-bg-warning);
    padding: 6px 16px;
    border-radius: 100px;

    &--expired {
      background: var(--h5-bg-muted);
    }
  }

  &__countdown-label {
    font-size: 12px;
    color: var(--h5-text-warning);
  }

  &__countdown-time {
    color: var(--h5-text-warning);
    font-weight: 700;
    font-size: 14px;
  }

  &__detail {
    width: 100%;
    border-top: 1px solid var(--h5-border);
    padding-top: 12px;
  }

  &__detail-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    margin-bottom: 6px;

    // 左侧标签不收缩
    span:first-child {
      flex-shrink: 0;
      color: var(--h5-text-secondary);
    }

    // 右侧值单行省略，避免长订单号折行撑高头部
    span:last-child {
      flex: 1;
      min-width: 0;
      color: var(--h5-text-primary);
      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  // 中间唯一滚动区：支付项再多也不压底栏
  &__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 20px 20px 16px;
  }

  &__section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--h5-text-primary);
    margin-bottom: 16px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__item {
    background: var(--h5-bg-card);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 2px solid transparent;
    transition: all 0.2s ease;

    &--active {
      border-color: @primary;
      background: var(--h5-bg-brand-soft);
    }
  }

  &__item-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__pay-name {
    font-size: 16px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--h5-text-primary);
  }

  &__recommend {
    font-size: 12px;
    color: var(--h5-text-warning);
    background: var(--h5-bg-warning);
    border: 1px solid #ffd591;
    padding: 0 4px;
    border-radius: 4px;
  }

  &__radio {
    width: 20px;
    height: 20px;
    border: 2px solid var(--h5-text-placeholder);
    border-radius: 50%;
    transition: all 0.2s;
    flex-shrink: 0;

    &--checked {
      border-color: @primary;
      background: @primary;
      box-shadow: inset 0 0 0 3px var(--h5-bg-card);
    }
  }

  &__qrcode {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--h5-bg-card);
    border-radius: 12px;
  }

  &__qrcode-tip {
    margin: 0;
    font-size: 13px;
    color: var(--h5-text-secondary);
    text-align: center;
  }

  // 文档流底栏，不再 fixed，天然不被列表遮挡
  &__footer {
    flex-shrink: 0;
    z-index: 10;
    padding: 12px 20px calc(16px + env(safe-area-inset-bottom, 0px));
    background: var(--h5-bg-card);
    box-shadow: 0 -2px 10px rgb(0 0 0 / 5%);
  }

  &__pay-btn {
    width: 100%;
    height: 48px;
    background: @primary;
    color: #fff;
    border: none;
    border-radius: 100px;
    font-size: 18px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(93, 157, 254, 0.3);

    &:active {
      background: @primary-dark;
      opacity: 0.95;
    }

    &:disabled {
      opacity: 0.6;
    }
  }
}

@keyframes cashier-result-up {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes cashier-result-pop {
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
