<template>
  <div>
    <div class="container">
      <div style="font-size: 28px;margin-top: 10px;">
        {{ cashierInfo.cashierName || '支付宝收银台' }}
      </div>
      <div class="amount-display">
        <p style="font-size: 20px">
          付款金额
        </p>
        <p style="font-size: 32px;">
          ¥ {{ amount }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { showNotify } from 'vant'

import { AggregateTypeEnum } from '@/enums/daxpay/DaxPayEnum'
import router from '@/router'
import {
  AggregateOrderAndConfigResult, checkoutPay, CheckoutPayParam,
} from '@/views/daxpay/checkout/CheckoutPay.api'
import {
  getAggregateConfig,
} from '@/views/daxpay/checkout/CheckoutPay.api'

const route = useRoute()
const { orderNo } = route.params

const loading = ref<boolean>(false)
const cashierInfo = ref<AggregateOrderAndConfigResult>({
  aggregateConfig: {},
  config: {},
  order: {},
})
const amount = ref<string>('0')
const description = ref<string>('')

onMounted(() => {
  initData()
})

/**
 * 初始化数据
 */
function initData() {
  getAggregateConfig(orderNo, AggregateTypeEnum.ALIPAY).then(({ data }) => {
    cashierInfo.value = data
  }).catch((res) => {
    router.push({ name: 'ErrorResult', query: { msg: res.message } })
  })
}

/**
 * 支付
 */
function pay() {
  const amountValue = Number(amount.value)
  if (amountValue === 0) {
    showNotify({ type: 'warning', message: '金额不可为0' })
    return
  }
  loading.value = true
  const from = {
  } as CheckoutPayParam
  checkoutPay(from)
    .then(({ data }) => {
      loading.value = false

    })
}
</script>

<style scoped lang="less">
@color: #108ee9;

:deep(.van-key--blue) {
  background: @color;
}
.container {
  background-color: @color;
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  text-align: center;
  color: white;
  .amount-display {
    background-color: white;
    color: @color;
    border-radius: 20px;
    padding: 20px;
    margin: 20px 0;
  }
  .amount-display p {
    margin: 5px 0;
  }
}
.remark {
  color: @color;
}
</style>
