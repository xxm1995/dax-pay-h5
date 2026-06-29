<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'HomePage' })

const { t } = useI18n()

// 由 vite define 注入的项目信息
const { pkg, lastBuildTime } = __APP_INFO__
const version = pkg.version
</script>

<template>
  <div class="home">
    <div class="home__body">
      <div class="home__welcome">
        <!-- DaxPay 文字字标（public/logo.svg，与 PC 首页同源） -->
        <img class="home__logo" src="/logo.svg" alt="DaxPay">
        <!-- 欢迎语 -->
        <div class="home__title">
          {{ t('home.welcome') }}
        </div>
      </div>
    </div>
    <!-- 底部项目信息 -->
    <div class="home__footer">
      <p>{{ t('home.version') }}: v{{ version }}</p>
      <p>{{ t('home.buildTime') }}: {{ lastBuildTime }}</p>
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

  // 文字字标（保比例，mobile-forever 正常转 vw）
  &__logo {
    width: 160px;
    height: auto;
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
