<template>
  <div class="page-container flex flex-col justify-center" v-if="show">
    <div class="text-center">
      <img src="~@/assets/icons/exception/403.svg" alt="">
    </div>
    <div class="text-center">
      <h1 class="text-base text-gray-500">
        请使用支付宝、微信等支付程序进行扫码支付
      </h1>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import router from '@/router'

const route = useRoute()

const { mchNo, appId } = route.params
const { fixed, amount } = route.query

const show = ref(false)
const ua = navigator.userAgent

if (ua.includes('MicroMessenger')) {
  router.push({ path: `/wechat/cashier/${mchNo}/${appId}`, query: { fixed, amount }, replace: true })
}
else if (ua.includes('Alipay')) {
  router.push({ path: `/alipay/cashier/${mchNo}/${appId}`, query: { fixed, amount }, replace: true })
}
else {
  router.push({ name: 'ErrorResult', query: { msg: '请使用支付宝、微信等支付程序进行扫码支付' }, replace: true })
}
</script>

<style scoped lang="less">
.page-container {
  width: 100%;
  border-radius: 4px;
  padding: 50px 0;
  height: 100vh;

  .text-center {
    h1 {
      color: #666;
      padding: 5vh 0;
      font-size: x-large;
    }
  }

  img {
    width: 350px;
    margin: 0 auto;
  }
}
</style>
