<script lang="ts" setup>
import type { AggregatePayResult, GatewayOrderInfo } from '@/shared/api/gateway'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { aggregatePay, getGatewayOrder } from '@/shared/api/gateway'

defineOptions({ name: 'PcAggregatePage' })

const { t } = useI18n()
const route = useRoute()
const orderNo = route.params.orderNo as string

const loading = ref(true)
const paying = ref(false)
const loadError = ref('')
const order = ref<GatewayOrderInfo>({})
const payResult = ref<AggregatePayResult | null>(null)
const message = ref('')

let pollTimer: ReturnType<typeof setInterval> | null = null

const amountYuan = computed(() => {
  if (!order.value.amount) {
    return '0.00'
  }
  return (order.value.amount / 100).toFixed(2)
})

const paid = computed(() => order.value.status === 'paid')

function detectScene(): string {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('micromessenger')) {
    return 'wechat_pay'
  }
  if (ua.includes('alipayclient') || ua.includes('alipay')) {
    return 'alipay'
  }
  if (ua.includes('unionpay') || ua.includes('cloudpay')) {
    return 'union_pay'
  }
  return 'wechat_pay'
}

onMounted(async () => {
  await loadOrder()
  if (!loadError.value && !paid.value) {
    await doPay()
  }
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
  }
})

async function loadOrder() {
  loading.value = true
  try {
    order.value = await getGatewayOrder(orderNo)
  }
  catch (e: any) {
    loadError.value = e?.message || t('aggregate.loadFail')
  }
  finally {
    loading.value = false
  }
}

async function doPay() {
  if (paying.value || paid.value) {
    return
  }
  paying.value = true
  message.value = ''
  try {
    payResult.value = await aggregatePay({
      orderNo,
      scene: detectScene(),
      device: 'pc',
    })
    if (payResult.value?.status === 'success') {
      order.value.status = 'paid'
      message.value = t('aggregate.paid')
      return
    }
    if (payResult.value?.payBody && payResult.value.payBodyType === 'url') {
      window.location.href = payResult.value.payBody
      return
    }
    startPoll()
  }
  catch (e: any) {
    message.value = e?.message || t('aggregate.payFail')
  }
  finally {
    paying.value = false
  }
}

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
        message.value = t('aggregate.paid')
      }
    }
    catch {
      // ignore
    }
  }, 2000)
}
</script>

<template>
  <div class="pc-aggregate">
    <div class="pc-aggregate__card">
      <template v-if="loading">
        <p>{{ t('common.loading') }}</p>
      </template>
      <template v-else-if="loadError">
        <p class="pc-aggregate__error">
          {{ loadError }}
        </p>
      </template>
      <template v-else>
        <h1 class="pc-aggregate__title">
          {{ order.title || t('aggregate.defaultTitle') }}
        </h1>
        <div class="pc-aggregate__amount">
          ¥{{ amountYuan }}
        </div>
        <p class="pc-aggregate__meta">
          {{ t('aggregate.orderNo') }}: {{ order.orderNo }}
        </p>
        <p v-if="paid" class="pc-aggregate__success">
          {{ t('aggregate.paid') }}
        </p>
        <p v-else-if="message" class="pc-aggregate__msg">
          {{ message }}
        </p>
        <pre v-if="payResult?.payBody && !paid" class="pc-aggregate__body">{{ payResult.payBody }}</pre>
        <button
          v-if="!paid"
          class="pc-aggregate__btn"
          :disabled="paying"
          @click="doPay"
        >
          {{ paying ? t('aggregate.paying') : t('aggregate.retry') }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pc-aggregate {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  padding: 24px;
}

.pc-aggregate__card {
  width: 420px;
  padding: 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgb(0 0 0 / 8%);
  text-align: center;
}

.pc-aggregate__title {
  margin: 0 0 16px;
  font-size: 18px;
  color: #303133;
  font-weight: 500;
}

.pc-aggregate__amount {
  font-size: 40px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.pc-aggregate__meta {
  font-size: 13px;
  color: #909399;
  margin: 0 0 16px;
}

.pc-aggregate__error {
  color: #ee0a24;
}

.pc-aggregate__success {
  color: #07c160;
  font-size: 16px;
}

.pc-aggregate__msg {
  color: #e6a23c;
  font-size: 14px;
}

.pc-aggregate__body {
  margin: 12px 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  font-size: 12px;
  text-align: left;
  word-break: break-all;
  white-space: pre-wrap;
  max-height: 180px;
  overflow: auto;
}

.pc-aggregate__btn {
  margin-top: 12px;
  width: 100%;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: #4787f7;
  color: #fff;
  font-size: 15px;
  cursor: pointer;
}

.pc-aggregate__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
