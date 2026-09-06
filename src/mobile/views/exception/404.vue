<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

defineOptions({ name: 'ErrorPageSon' })

const { t } = useI18n()
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
        {{ t('error.notFound') }}
      </h1>
      <van-button type="primary" @click="goHome">
        {{ t('common.backHome') }}
      </van-button>
    </div>
  </div>
</template>

<style lang="less" scoped>
.page-container {
  height: 100%;

  .text-center {
    h1 {
      color: var(--h5-text-secondary);
      padding: 20px 0;
    }
  }

  img {
    width: 350px;
    margin: 0 auto;
  }
}
</style>
