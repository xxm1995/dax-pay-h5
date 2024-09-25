<template>
  <div />
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import type { AuthCodeParam } from '@/views/daxpay/channel/ChannelAuth.api'
import { authAndSet } from '@/views/daxpay/channel/ChannelAuth.api'

const route = useRoute()
const { appId, channel, queryCode } = route.params
const { code } = route.query
const param = ref<AuthCodeParam>({
  appId: appId as string,
  queryCode: queryCode as string,
  authCode: code as string,
  channel: channel as string,
})

onMounted(() => {
  init()
})

/**
 * 页面初始化
 */
async function init() {
  authAndSet(param.value).then((res) => {
    console.log(res)
  })
}
</script>

<style scoped lang="less">

</style>
