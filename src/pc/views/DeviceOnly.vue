<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'PcDeviceOnly' })

const { t } = useI18n()
const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="pc-device-only">
    <p class="pc-device-only__title">
      {{ t('error.deviceOnlyMobile.title') }}
    </p>
    <p class="pc-device-only__desc">
      {{ t('error.deviceOnlyMobile.desc') }}
    </p>
    <button class="pc-device-only__btn" type="button" @click="goHome">
      {{ t('common.backHome') }}
    </button>
  </div>
</template>

<style scoped>
/* PC 端：scoped 原生 px + 媒体查询，不使用 UnoCSS 的 px 原子类 */
.pc-device-only {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--h5-bg-page);
}

.pc-device-only__title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--h5-text-primary);
}

.pc-device-only__desc {
  margin: 0 0 32px;
  font-size: 14px;
  color: var(--h5-text-secondary);
}

.pc-device-only__btn {
  padding: 10px 28px;
  font-size: 14px;
  color: #ffffff;
  background: #5d9dfe;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.pc-device-only__btn:hover {
  opacity: 0.85;
}
</style>
