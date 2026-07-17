<script lang="ts" setup>
/**
 * 聚合扫码-云闪付环境
 */
import AggregateEnvPage from '../EnvPage.vue'

defineOptions({ name: 'AggregateUnionPage' })
</script>

<template>
  <AggregateEnvPage client-env="union_pay" />
</template>
