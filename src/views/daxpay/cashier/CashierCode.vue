<template>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import router from '@/router'

const route = useRoute()
const { code } = route.params

const ua = navigator.userAgent
if (ua.includes('MicroMessenger')) {
  router.push({ path: `/cashier/wechat/${code}`, replace: true })
}
else if (ua.includes('Alipay')) {
  router.push({ path: `/cashier/alipay/${code}`, replace: true })
}
else {
  router.push({ name: 'ErrorResult', query: { msg: '请使用支付宝、微信等支付程序进行扫码支付' }, replace: true })
}
</script>

<style scoped lang="less">
</style>
