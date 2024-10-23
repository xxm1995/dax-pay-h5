<template>
  <div class="page-container flex flex-col justify-center">
    <div class="text-center">
      <img src="../../assets/icons/exception/403.svg" alt="">
    </div>
    <div class="text-center">
      <h1 class="text-base text-gray-500">
        {{ msg }}
      </h1>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { unref } from 'vue'

const { currentRoute } = useRouter()
const { query } = unref(currentRoute)

// 获取请求路径下的错误信息
const msg = (query.msg as string) || '出现错误，请稍后重试'
</script>

<style lang="less" scoped>
  .page-container {
  width: 100%;
  border-radius: 4px;
  padding: 50px 0;
  height: 100vh;

  .text-center {
    h1 {
      color: #666;
      padding: 5vh 0;
      font-size: x-large;
    }
  }

  img {
    width: 350px;
    margin: 0 auto;
  }
}
</style>
