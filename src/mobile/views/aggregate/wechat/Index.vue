<script lang="ts" setup>
/**
 * 聚合扫码-微信环境
 */
import AggregateEnvPage from '../EnvPage.vue'

defineOptions({ name: 'AggregateWechatPage' })
</script>

<template>
  <AggregateEnvPage client-env="wechat" />
</template>
