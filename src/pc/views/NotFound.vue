<script lang="ts" setup>
defineOptions({ name: 'PcNotFound' })

const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="pc-notfound">
    <img class="pc-notfound__logo" src="/logo.svg" alt="DaxPay">
    <p class="pc-notfound__code">
      404
    </p>
    <p class="pc-notfound__text">
      抱歉，你访问的页面不存在
    </p>
    <button class="pc-notfound__btn" type="button" @click="goHome">
      返回首页
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

.pc-notfound__logo {
  width: 160px;
  height: auto;
}

.pc-notfound__code {
  margin: 24px 0 8px;
  font-size: 56px;
  font-weight: 900;
  line-height: 1;
  color: #1d2129;
}

.pc-notfound__text {
  margin: 0 0 32px;
  font-size: 16px;
  color: #4e5969;
}

.pc-notfound__btn {
  padding: 10px 28px;
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
  .pc-notfound__logo {
    width: 120px;
  }

  .pc-notfound__code {
    font-size: 44px;
  }
}
</style>
