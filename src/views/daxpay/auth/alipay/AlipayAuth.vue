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
import { ref } from 'vue'
import { showDialog } from 'vant'
import type { AuthCodeParam } from '@/views/daxpay/auth/ChannelAuth.api'
import { authAndSet } from '@/views/daxpay/auth/ChannelAuth.api'

const script = document.createElement('script')
script.setAttribute(
  'src',
  'https://gw.alipayobjects.com/as/g/h5-lib/alipayjsapi/3.1.1/alipayjsapi.min.js',
)
document.head.appendChild(script)
// 脚本加载完毕后进行初始化
script.onload = () => {
  init()
}

const route = useRoute()
const { appId, channel, queryCode, aliAppId } = route.params

const show = ref(true)

/**
 * 页面初始化
 */
async function init() {
  ap.getAuthCode ({
    appId: aliAppId,
    scopes: ['auth_base'],
  }, (res) => {
    const authCode = res.authCode
    const param = ref<AuthCodeParam>({
      appId: appId as string,
      queryCode: queryCode as string,
      authCode: authCode as string,
      channel: channel as string,
    })
    authAndSet(param.value).then(() => {
      show.value = false
      showDialog({
        message: '已成功获取用户信息!',
        confirmButtonText: '关闭',
      }).then(() => {
        AlipayJSBridge.call('closeWebview')
      })
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
