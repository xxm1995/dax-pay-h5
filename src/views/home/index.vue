<script setup lang="ts">
import Logo from '@/components/Logo.vue'

defineOptions({ name: 'HomePage' })

// 由 vite define 注入的项目信息
const { pkg, lastBuildTime } = __APP_INFO__
const version = pkg.version
</script>

<template>
  <div class="home">
    <div class="home__body">
      <div class="home__welcome">
        <!-- DaxPay 文字 logo（默认主题色时显示） -->
        <Logo />
        <!-- 欢迎语 -->
        <div class="home__title">
          欢迎使用 DaxPay
        </div>
      </div>
    </div>
    <!-- 底部项目信息 -->
    <div class="home__footer">
      <p>版本号: v{{ version }}</p>
      <p>构建时间: {{ lastBuildTime }}</p>
    </div>
  </div>
</template>

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

  // logo + 欢迎语纵向居中
  &__welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  // 欢迎语（参考商业版 text-2xl font-black mt-12）
  &__title {
    margin-top: 12px;
    text-align: center;
    font-size: 24px;
    font-weight: 900;
  }

  // 底部项目信息（版本号 / 构建时间，参考商业版 fixed bottom-6 text-xs opacity-50）
  &__footer {
    position: fixed;
    bottom: 24px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 12px;
    opacity: 0.5;
    line-height: 1.6;

    p {
      margin: 0;
    }
  }
}
</style>
