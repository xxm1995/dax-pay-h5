<template>
  <div>
    <van-overlay :show="loading">
      <div class="loading-wrapper" @click.stop>
        <van-loading size="24px">
          支付中...
        </van-loading>
      </div>
    </van-overlay>
      <van-cell-group inset title="订单信息">
        <van-cell title="金额" title-style="font-size: 22px;color: red">
          <template #default>
            <span style="font-size: 22px;color: red">{{ aggregateInfo.order.amount }}元</span>
          </template>
        </van-cell>
        <van-field label="标题" :model-value="aggregateInfo.order.title" readonly />
        <van-field label="订单号" :model-value="aggregateInfo.order.bizOrderNo" readonly />
        <van-field label="支付号" :model-value="aggregateInfo.order.orderNo" readonly />
        <van-field label="描述" rows="2"  type="textarea" :model-value="aggregateInfo.order.description" readonly />
      </van-cell-group>
      <van-submit-bar safe-area-inset-bottom :price="(aggregateInfo.order.amount || 0)*100" button-text="支付" @submit="pay" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { CheckoutAggregateEnum } from '@/enums/daxpay/DaxPayEnum'
import router from '@/router'
import type {
  AggregateOrderAndConfigResult,
  CheckoutAggregatePayParam,
} from '@/views/daxpay/checkout/CheckoutPay.api'
import {
  aggregatePay,
  getAggregateConfig,
} from '@/views/daxpay/checkout/CheckoutPay.api'

const route = useRoute()
const { orderNo } = route.params

const loading = ref<boolean>(false)
const aggregateInfo = ref<AggregateOrderAndConfigResult>({
  aggregateConfig: {},
  config: {},
  order: {},
})

onMounted(() => {
  initData()
})

/**
 * 初始化数据
 */
async function initData() {
  // 查询订单和配置
  await getAggregateConfig(orderNo, CheckoutAggregateEnum.ALI).then(({ data }) => {
    aggregateInfo.value = data
  }).catch((res) => {
    router.push({ name: 'ErrorResult', query: { msg: res.message }, replace: true  })
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
    aggregateType: CheckoutAggregateEnum.ALI,
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
</style>
