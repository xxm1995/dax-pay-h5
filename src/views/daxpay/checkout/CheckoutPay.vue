<template>
  <div>

  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'
import type { CheckoutOrderAndConfigResult } from './CheckoutPay.api'
import { getOrderAndConfig } from './CheckoutPay.api'
import { CheckoutTypeEnum } from '@/enums/daxpay/DaxPayEnum'
import router from '@/router'

const route = useRoute()

const { orderNo } = route.params
const ua = navigator.userAgent

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
  })
  // 判断是否自动升级为聚合控制台
  if (orderAndConfig.value.config.h5AutoUpgrade) {
    goAggregate()
  }
}

/**
 * 跳转到聚合收银台
 */
function goAggregate() {
  if (ua.includes('MicroMessenger')) {
    router.push({ path: `/checkout/wechat/${orderNo}`, replace: true })
  }
  else if (ua.includes('Alipay')) {
    router.push({ path: `/checkout/alipay/${orderNo}`, replace: true })
  }
}

/**
 * 发起支付
 */
function pay(){

}
</script>

<style scoped lang="less">
</style>
