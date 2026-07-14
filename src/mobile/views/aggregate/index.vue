<script lang="ts" setup>
import type { AggregatePayResult, GatewayOrderInfo } from '@/shared/api/gateway'
import { showNotify, showSuccessToast } from 'vant'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { aggregatePay, getGatewayOrder } from '@/shared/api/gateway'

defineOptions({ name: 'AggregatePage' })

const { t } = useI18n()
const route = useRoute()
const orderNo = route.params.orderNo as string

const loading = ref(true)
const paying = ref(false)
const loadError = ref('')
const order = ref<GatewayOrderInfo>({})
const payResult = ref<AggregatePayResult | null>(null)

const remainSeconds = ref(0)
let timer: ReturnType<typeof setInterval> | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null

const amountYuan = computed(() => {
  if (!order.value.amount) {
    return '0.00'
  }
  return (order.value.amount / 100).toFixed(2)
})

const countdown = computed(() => {
  const s = remainSeconds.value
  const m = String(Math.floor(s / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return `${m}:${sec}`
})

const paid = computed(() => order.value.status === 'paid')

/**
 * 根据 UA 识别收银场景
 */
function detectClientEnv(): string {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('micromessenger')) {
    return 'wechat_pay'
  }
  if (ua.includes('alipayclient') || ua.includes('alipay')) {
    return 'alipay'
  }
  if (ua.includes('unionpay') || ua.includes('cloudpay') || ua.includes('upwallet')) {
    return 'union_pay'
  }
  // 默认按微信处理(浏览器扫码预览)
  return 'wechat_pay'
}

/**
 * 场景展示名
 */
function clientEnvLabel(clientEnv: string) {
  if (clientEnv === 'alipay') {
    return t('aggregate.clientEnv.alipay')
  }
  if (clientEnv === 'union_pay') {
    return t('aggregate.clientEnv.union')
  }
  return t('aggregate.clientEnv.wechat')
}

onMounted(async () => {
  await loadOrder()
  if (!loadError.value && !paid.value) {
    await doPay()
  }
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
  if (pollTimer) {
    clearInterval(pollTimer)
  }
})

/**
 * 加载订单
 */
async function loadOrder() {
  loading.value = true
  loadError.value = ''
  try {
    order.value = await getGatewayOrder(orderNo)
    if (order.value.expiredTime) {
      const exp = new Date(order.value.expiredTime).getTime()
      remainSeconds.value = Math.max(0, Math.floor((exp - Date.now()) / 1000))
      timer = setInterval(() => {
        if (remainSeconds.value > 0) {
          remainSeconds.value--
        }
        else if (timer) {
          clearInterval(timer)
        }
      }, 1000)
    }
  }
  catch (e: any) {
    loadError.value = e?.message || t('aggregate.loadFail')
  }
  finally {
    loading.value = false
  }
}

/**
 * 发起聚合支付
 */
async function doPay() {
  if (paying.value || paid.value) {
    return
  }
  paying.value = true
  try {
    const clientEnv = detectClientEnv()
    payResult.value = await aggregatePay({
      orderNo,
      clientEnv,
      device: 'mobile',
    })
    // 同步成功
    if (payResult.value?.status === 'success') {
      order.value.status = 'paid'
      showSuccessToast(t('aggregate.paid'))
      redirectIfNeeded()
      return
    }
    // 有 payBody 时展示/尝试跳转(二维码类由前端展示, 链接类直接跳)
    if (payResult.value?.payBody && payResult.value.payBodyType === 'url') {
      window.location.href = payResult.value.payBody
      return
    }
    // 轮询订单状态
    startPoll()
  }
  catch (e: any) {
    showNotify({ type: 'danger', message: e?.message || t('aggregate.payFail') })
  }
  finally {
    paying.value = false
  }
}

/**
 * 轮询支付结果
 */
function startPoll() {
  if (pollTimer) {
    clearInterval(pollTimer)
  }
  pollTimer = setInterval(async () => {
    try {
      const latest = await getGatewayOrder(orderNo)
      order.value = latest
      if (latest.status === 'paid') {
        if (pollTimer) {
          clearInterval(pollTimer)
        }
        showSuccessToast(t('aggregate.paid'))
        redirectIfNeeded()
      }
    }
    catch {
      // 忽略轮询错误
    }
  }, 2000)
}

function redirectIfNeeded() {
  if (order.value.returnUrl) {
    setTimeout(() => {
      window.location.href = order.value.returnUrl!
    }, 1200)
  }
}
</script>

<template>
  <div class="aggregate">
    <div class="aggregate__brand" />

    <div v-if="loading" class="aggregate__card">
      <van-loading color="#5d9dfe" size="24px" />
    </div>

    <div v-else-if="loadError" class="aggregate__card">
      <p class="aggregate__error">
        {{ loadError }}
      </p>
    </div>

    <template v-else>
      <div class="aggregate__card">
        <div class="aggregate__title">
          {{ order.title || t('aggregate.defaultTitle') }}
        </div>
        <div class="aggregate__amount">
          <span class="aggregate__currency">¥</span>{{ amountYuan }}
        </div>
        <div v-if="order.description" class="aggregate__desc">
          {{ order.description }}
        </div>
        <div class="aggregate__meta">
          <div>{{ t('aggregate.orderNo') }}: {{ order.orderNo }}</div>
          <div v-if="remainSeconds > 0 && !paid">
            {{ t('aggregate.countdown') }}: {{ countdown }}
          </div>
          <div>{{ t('aggregate.clientEnvLabel') }}: {{ clientEnvLabel(detectClientEnv()) }}</div>
        </div>
      </div>

      <div v-if="paid" class="aggregate__card aggregate__success">
        {{ t('aggregate.paid') }}
      </div>

      <div v-else-if="payResult?.payBody && payResult.payBodyType !== 'url'" class="aggregate__card">
        <div class="aggregate__pay-tip">
          {{ t('aggregate.useAppPay') }}
        </div>
        <!-- 通道返回的调起参数, 具体调起逻辑按 payBodyType 扩展 -->
        <pre class="aggregate__pay-body">{{ payResult.payBody }}</pre>
      </div>

      <div v-else class="aggregate__actions">
        <van-button
          type="primary"

          round block
          :loading="paying"
          @click="doPay"
        >
          {{ paying ? t('aggregate.paying') : t('aggregate.retry') }}
        </van-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.aggregate {
  min-height: 100%;
  padding-bottom: 40px;
  background: #f5f7fa;
}

.aggregate__brand {
  height: 120px;
  background: linear-gradient(135deg, #5d9dfe, #4787f7);
}

.aggregate__card {
  margin: -48px 16px 16px;
  padding: 24px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgb(0 0 0 / 6%);
  text-align: center;
}

.aggregate__title {
  font-size: 16px;
  color: #303133;
  margin-bottom: 12px;
}

.aggregate__amount {
  font-size: 36px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.aggregate__currency {
  font-size: 20px;
  margin-right: 4px;
}

.aggregate__desc {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}

.aggregate__meta {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #909399;
  text-align: left;
  line-height: 1.8;
}

.aggregate__error {
  color: #ee0a24;
  font-size: 14px;
}

.aggregate__success {
  color: #07c160;
  font-size: 16px;
  font-weight: 500;
}

.aggregate__pay-tip {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.aggregate__pay-body {
  margin: 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 11px;
  text-align: left;
  word-break: break-all;
  white-space: pre-wrap;
  max-height: 160px;
  overflow: auto;
}

.aggregate__actions {
  margin: 0 16px;
}
</style>
