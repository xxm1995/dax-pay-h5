<template>
  <div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const {appId, channel, queryCode, aliAppId} = route.params

console.log(appId, channel)
</script>

<style scoped lang="less">

</style>
