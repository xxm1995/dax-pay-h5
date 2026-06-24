<script lang="ts" setup>
defineOptions({ name: 'MobileDeviceOnly' })

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="device-only">
    <p class="device-only__title">
      此页面仅限电脑端访问
    </p>
    <p class="device-only__desc">
      请在电脑浏览器中打开本页面
    </p>
    <van-button type="primary" @click="goHome">
      返回首页
    </van-button>
  </div>
</template>

<style scoped lang="less">
.device-only {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 24px;
  text-align: center;
}

.device-only__title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
}

.device-only__desc {
  margin: 0 0 24px;
  font-size: 14px;
  opacity: 0.6;
}
</style>
