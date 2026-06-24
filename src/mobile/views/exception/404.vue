<script lang="ts" setup>
defineOptions({ name: 'ErrorPageSon' })

const router = useRouter()
function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="page-container flex flex-col justify-center">
    <div class="text-center">
      <img src="~@/shared/assets/icons/exception/404.svg" alt="404">
    </div>
    <div class="text-center">
      <h1 class="m-4 text-base">
        抱歉，你访问的页面不存在
      </h1>
      <van-button type="primary" @click="goHome">
        回到首页
      </van-button>
    </div>
  </div>
</template>

<style lang="less" scoped>
.page-container {
  height: 100%;

  .text-center {
    h1 {
      color: #666;
      padding: 20px 0;
    }
  }

  img {
    width: 350px;
    margin: 0 auto;
  }
}
</style>
