<script lang="ts" setup>
defineOptions({ name: 'PcDeviceOnly' })

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="pc-device-only">
    <p class="pc-device-only__title">
      此页面仅限手机端访问
    </p>
    <p class="pc-device-only__desc">
      请用手机扫描二维码，或在手机浏览器中打开本页面
    </p>
    <button class="pc-device-only__btn" type="button" @click="goHome">
      返回首页
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
  background: #f7f8fa;
}

.pc-device-only__title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
}

.pc-device-only__desc {
  margin: 0 0 32px;
  font-size: 14px;
  color: #4e5969;
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
