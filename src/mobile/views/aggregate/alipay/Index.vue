<script lang="ts" setup>
/**
 * 聚合扫码-支付宝环境
 */
import AggregateEnvPage from '../EnvPage.vue'

defineOptions({ name: 'AggregateAlipayPage' })
</script>

<template>
  <AggregateEnvPage client-env="alipay" />
</template>
