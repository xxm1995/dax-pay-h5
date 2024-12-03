<template>
  <div>
    <div class="container">
      <div style="font-size: 28px;margin-top: 10px;">
        {{ aggregateInfo.config.name || '支付宝收银台' }}
      </div>
      <div class="amount-display">
        <p style="font-size: 20px">
          付款金额
        </p>
        <p style="font-size: 32px;">
          ¥ {{ aggregateInfo.order.amount || 0.00 }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { AggregateEnum } from '@/enums/daxpay/DaxPayEnum'
import router from '@/router'
import {
  AggregateOrderAndConfigResult,
  aggregatePay,
  CheckoutAggregatePayParam,
  getAggregateConfig
} from "@/views/daxpay/checkout/CheckoutPay.api";

const route = useRoute()
const { orderNo } = route.params

const loading = ref<boolean>(false)
const aggregateInfo = ref<AggregateOrderAndConfigResult>({
  aggregateConfig: {},
  config: {},
  order: {}
})

onMounted(() => {
  initData()
})

/**
 * 初始化数据
 */
async function initData() {
  // 查询订单和配置
  await getAggregateConfig(orderNo, AggregateEnum.ALI).then(({ data }) => {
    aggregateInfo.value = data
  }).catch((res) => {
    router.push({ name: 'ErrorResult', query: { msg: res.message } })
  })
  // 判断是否自动拉起支付
  if (aggregateInfo.value.aggregateConfig.autoLaunch) {
    pay()
  }

}

/**
 * 支付
 */
function pay() {
  loading.value = true
  const from = {
    orderNo: aggregateInfo.value.order.orderNo,
    aggregateType: AggregateEnum.ALI,
  } as CheckoutAggregatePayParam
  aggregatePay(from)
    .then(({ data }) => {
      loading.value = false
      // 跳转到H5/扫码支付页面
      location.replace(data.payBody)
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
