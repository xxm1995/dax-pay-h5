<template>
  <div class="home">
    <van-nav-bar title="DaxPay" />
    <div class="home__body">
      <van-empty description="DaxPay H5 — 等待业务开发" />
    </div>
  </div>
</template>

<script setup lang="ts">
// 占位首页：业务开发时替换为实际首页
</script>

<style scoped lang="less">
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  &__body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
