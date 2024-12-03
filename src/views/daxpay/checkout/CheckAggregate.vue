<template>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import router from '@/router'

const route = useRoute()
const { code: orderNo } = route.params

const ua = navigator.userAgent
if (ua.includes('MicroMessenger')) {
  router.push({ path: `/checkout/wechat/${orderNo}`, replace: true })
}
else if (ua.includes('Alipay')) {
  router.push({ path: `/checkout/alipay/${orderNo}`, replace: true })
}
else {
  router.push({ name: 'ErrorResult', query: { msg: '请使用支付宝、微信等软件进行扫码支付' }, replace: true })
}
</script>

<style scoped lang="less">
</style>
