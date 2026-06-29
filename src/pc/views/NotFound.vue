<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import notFoundImg from '@/shared/assets/icons/exception/404.svg'

defineOptions({ name: 'PcNotFound' })

const { t } = useI18n()
const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="pc-notfound">
    <img class="pc-notfound__img" :src="notFoundImg" alt="404">
    <h1 class="pc-notfound__text">
      {{ t('error.notFound') }}
    </h1>
    <button class="pc-notfound__btn" type="button" @click="goHome">
      {{ t('common.backHome') }}
    </button>
  </div>
</template>

<style scoped>
/* PC 端 404 页：scoped 原生 px + 媒体查询，不使用 UnoCSS 的 px 原子类 */
.pc-notfound {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
}

.pc-notfound__img {
  width: 400px;
  height: auto;
}

.pc-notfound__text {
  margin: 24px 0 32px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
  color: #4e5969;
}

.pc-notfound__btn {
  padding: 10px 32px;
  font-size: 14px;
  color: #ffffff;
  background: #5d9dfe;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.pc-notfound__btn:hover {
  opacity: 0.85;
}

@media (max-width: 768px) {
  .pc-notfound__img {
    width: 280px;
  }
}
</style>
