<template>
  <div v-if="show">
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
          <span style="font-size: 22px;color: red">{{ orderAndConfig.order.amount }}元</span>
        </template>
      </van-cell>
      <van-field label="标题" :model-value="orderAndConfig.order.title" readonly />
      <van-field label="订单号" :model-value="orderAndConfig.order.bizOrderNo" readonly />
      <van-field label="支付号" :model-value="orderAndConfig.order.orderNo" readonly />
      <van-field label="描述" rows="2" type="textarea" :model-value="orderAndConfig.order.description" readonly />
    </van-cell-group>

    <van-cell-group v-for="group in orderAndConfig.groupConfigs" :key="group.id" inset :title="group.name">
      <van-space direction="vertical" fill>
        <van-button v-for="config in group.items" :key="config.id" type="primary" block @click="pay(config)">
          {{ config.name }}
        </van-button>
      </van-space>
    </van-cell-group>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'
import type {
  CheckoutItemConfigResult,
  CheckoutOrderAndConfigResult,
  CheckoutPayParam,
} from './CheckoutPay.api'
import {
  checkoutPay
  , getOrderAndConfig,
} from './CheckoutPay.api'

import { CheckoutTypeEnum } from '@/enums/daxpay/DaxPayEnum'
import router from '@/router'

const route = useRoute()

const { orderNo } = route.params
const ua = navigator.userAgent
const show = ref(false)
const loading = ref(false)
const orderAndConfig = ref<CheckoutOrderAndConfigResult>({
  order: {},
  config: {},
  groupConfigs: [],
})

/**
 * 初始化
 */
onMounted(() => {
  initData()
})

/**
 * 初始化数据
 */
async function initData() {
  // 获取收银台配置
  await getOrderAndConfig(orderNo, CheckoutTypeEnum.H5).then(({ data }) => {
    orderAndConfig.value = data
  }).catch((res) => {
    router.push({ name: 'ErrorResult', query: { msg: res.message }, replace: true })
  })
  // 判断是否自动升级为聚合控制台
  if (orderAndConfig.value.config.h5AutoUpgrade) {
    goAggregate()
    return
  }
  show.value = true
}

/**
 * 跳转到聚合收银台
 */
function goAggregate() {
  if (ua.includes('MicroMessenger')) {
    router.push({ path: `/aggregate/wechat/${orderNo}`, replace: true })
  }
  else if (ua.includes('Alipay')) {
    router.push({ path: `/aggregate/alipay/${orderNo}`, replace: true })
  }
  else {
    show.value = true
  }
}

/**
 * 发起支付
 */
function pay(config: CheckoutItemConfigResult) {
  loading.value = true
  const from = {
    orderNo,
    itemId: config.id,
  } as CheckoutPayParam
  checkoutPay(from).then(({ data }) => {
    loading.value = false
    // 跳转到支付页面
    location.replace(data.payBody)
  })
}
</script>

<style scoped lang="less">
</style>
