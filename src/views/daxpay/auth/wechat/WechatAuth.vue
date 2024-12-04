<template>
  <van-overlay v-show="show" :show="true">
    <div class="loading-wrapper" @click.stop>
      <van-loading size="24px">
        获取中...
      </van-loading>
    </div>
  </van-overlay>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'
import { showDialog } from 'vant'
import type { AuthCodeParam } from '@/views/daxpay/auth/ChannelAuth.api'
import { authAndSet } from '@/views/daxpay/auth/ChannelAuth.api'

const route = useRoute()
const { appId, channel, queryCode } = route.params
const { code } = route.query
const param = ref<AuthCodeParam>({
  appId: appId as string,
  queryCode: queryCode as string,
  authCode: code as string,
  channel: channel as string,
})
const show = ref(true)

onMounted(() => {
  init()
})

/**
 * 页面初始化
 */
async function init() {
  authAndSet(param.value).then(() => {
    show.value = false
    showDialog({
      message: '已成功获取用户信息!',
      confirmButtonText: '关闭',
    }).then(() => {
      WeixinJSBridge.call('closeWindow')
    })
  })
}
</script>

<style scoped lang="less">

.block {
  width: 120px;
  height: 120px;
  background-color: #fff;
}
</style>
