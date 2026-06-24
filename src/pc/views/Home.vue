<script setup lang="ts">
defineOptions({ name: 'PcHome' })

// 由 vite define 注入的项目信息（与移动端首页一致）
const { pkg, lastBuildTime } = __APP_INFO__
const version = pkg.version
</script>

<template>
  <div class="pc-home">
    <div class="pc-home__body">
      <div class="pc-home__welcome">
        <!-- DaxPay 文字徽标（与移动端首页默认 logo 一致，public/logo.svg） -->
        <img class="pc-home__logo" src="/logo.svg" alt="DaxPay">
        <!-- 欢迎语 -->
        <div class="pc-home__title">
          欢迎使用 DaxPay
        </div>
      </div>
    </div>
    <!-- 底部项目信息 -->
    <div class="pc-home__footer">
      <p>版本号: v{{ version }}</p>
      <p>构建时间: {{ lastBuildTime }}</p>
    </div>
  </div>
</template>

<style scoped>
/* PC 端首页：scoped 原生 px + 媒体查询，复刻移动端首页布局（全屏居中 + 底部信息） */
.pc-home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f7f8fa;
}

.pc-home__body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pc-home__welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pc-home__logo {
  width: 180px;
  height: auto;
}

.pc-home__title {
  margin-top: 16px;
  text-align: center;
  font-size: 28px;
  font-weight: 900;
  color: #1d2129;
}

.pc-home__footer {
  position: fixed;
  bottom: 24px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  opacity: 0.5;
  line-height: 1.6;
  color: #4e5969;
}

.pc-home__footer p {
  margin: 0;
}

@media (max-width: 768px) {
  .pc-home__logo {
    width: 140px;
  }

  .pc-home__title {
    font-size: 22px;
  }
}
</style>
