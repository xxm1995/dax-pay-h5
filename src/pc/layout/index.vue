<script setup lang="ts">
defineOptions({ name: 'PcLayout' })
</script>

<template>
  <div class="pc-shell">
    <header class="pc-header">
      <span class="pc-header__title">DaxPay · PC</span>
    </header>
    <main class="pc-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
/* PC 端样式示范：scoped 原生 px + 媒体查询，不使用 UnoCSS 的 px 原子类 */
.pc-shell {
  min-height: 100vh;
  background: #f5f6f8;
}

.pc-header {
  height: 56px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  background: #ffffff;
  border-bottom: 1px solid #ebedf0;
}

.pc-header__title {
  font-size: 18px;
  font-weight: 600;
  color: #1d2129;
}

.pc-main {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .pc-main {
    padding: 16px;
  }
}
</style>
