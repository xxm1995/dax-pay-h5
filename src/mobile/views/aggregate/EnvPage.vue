<script lang="ts" setup>
/**
 * 聚合扫码环境页（wechat/alipay/union_pay/douyin 共用）
 * clientEnv 由路由注入，不二次猜 UA（OAuth 回跳后仍稳定）
 */
import type { AggregateClientEnv } from '@/shared/utils/client-env'
import { showNotify, showSuccessToast } from 'vant'
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import QrCodeDisplay from '@/shared/components/pay/QrCodeDisplay.vue'
import { useAggregatePay } from '@/shared/pay/use-aggregate-pay'
import { isAggregateClientEnv } from '@/shared/utils/client-env'

defineOptions({ name: 'AggregateEnvPage' })

const props = defineProps<{
  /** 固定客户端环境 */
  clientEnv: AggregateClientEnv
}>()

const { t } = useI18n()
const route = useRoute()
const orderNo = route.params.orderNo as string

if (!isAggregateClientEnv(props.clientEnv)) {
  throw new Error(`invalid aggregate clientEnv: ${props.clientEnv}`)
}

const {
  loading,
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
  clientEnv: props.clientEnv,
  device: 'mobile',
  t,
  onPaid() {
    showSuccessToast(t('aggregate.paid'))
  },
  onError(message) {
    showNotify({ type: 'danger', message })
  },
})

/**
 * 环境展示名
 */
function clientEnvLabel() {
  if (props.clientEnv === 'alipay') {
    return t('aggregate.clientEnv.alipay')
  }
  if (props.clientEnv === 'union_pay') {
    return t('aggregate.clientEnv.union')
  }
  if (props.clientEnv === 'douyin') {
    return t('aggregate.clientEnv.douyin')
  }
  return t('aggregate.clientEnv.wechat')
}

/**
 * 终态文案
 */
function terminalMessage() {
  const s = order.value.status
  if (s === 'paid') {
    return t('aggregate.paid')
  }
  if (s === 'expired') {
    return t('aggregate.expired')
  }
  if (s === 'closed') {
    return t('aggregate.closed')
  }
  if (s === 'failed') {
    return t('aggregate.failed')
  }
  return ''
}

onMounted(() => {
  bootstrap()
})
</script>

<template>
  <div class="aggregate">
    <div class="aggregate__brand" />

    <div v-if="loading || authorizing" class="aggregate__card">
      <van-loading color="#5d9dfe" size="24px" />
      <p v-if="authorizing" class="aggregate__tip">
        {{ t('aggregate.authorizing') }}
      </p>
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
          <div>{{ t('aggregate.clientEnvLabel') }}: {{ clientEnvLabel() }}</div>
        </div>
      </div>

      <div v-if="paid" class="aggregate__card aggregate__success">
        {{ t('aggregate.paid') }}
      </div>

      <div v-else-if="terminal" class="aggregate__card">
        <p class="aggregate__error">
          {{ terminalMessage() }}
        </p>
      </div>

      <div v-else-if="expired" class="aggregate__card">
        <p class="aggregate__error">
          {{ t('aggregate.expired') }}
        </p>
      </div>

      <div v-else-if="showQrcode && qrContent" class="aggregate__card">
        <p class="aggregate__tip">
          {{ t('aggregate.scanQr') }}
        </p>
        <div class="aggregate__qr">
          <QrCodeDisplay :content="qrContent" :size="200" />
        </div>
      </div>

      <div
        v-else-if="payResult?.payBody && payResult.payBodyType !== 'link' && payResult.payBodyType !== 'jsapi'"
        class="aggregate__card"
      >
        <div class="aggregate__pay-tip">
          {{ t('aggregate.useAppPay') }}
        </div>
      </div>

      <div v-if="!paid && !terminal && !expired" class="aggregate__actions">
        <van-button
          type="primary"
          round
          block
          :loading="paying || authorizing"
          @click="doPay"
        >
          {{
            paying
              ? t('aggregate.paying')
              : (meta.autoLaunch ? t('aggregate.retry') : t('aggregate.payNow'))
          }}
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

.aggregate__tip,
.aggregate__pay-tip {
  font-size: 14px;
  color: #606266;
  margin: 8px 0;
}

.aggregate__qr {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}

.aggregate__actions {
  margin: 0 16px;
}
</style>
