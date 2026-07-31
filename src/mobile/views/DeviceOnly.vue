<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'MobileDeviceOnly' })

const { t } = useI18n()
const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="device-only">
    <p class="device-only__title">
      {{ t('error.deviceOnlyPc.title') }}
    </p>
    <p class="device-only__desc">
      {{ t('error.deviceOnlyPc.desc') }}
    </p>
    <van-button type="primary" @click="goHome">
      {{ t('common.backHome') }}
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
