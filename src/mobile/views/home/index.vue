<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import WebsiteFooter from '@/shared/components/WebsiteFooter.vue'
import { useDesignSetting } from '@/shared/hooks/setting/useDesignSetting'
import {
  getLogoUrl,
  getSystemName,
  websiteConfig,
} from '@/shared/logics/init-website-config'

defineOptions({ name: 'HomePage' })

const { t } = useI18n()
const { getDarkMode } = useDesignSetting()

// 由 vite define 注入的项目信息
const { pkg, lastBuildTime } = __APP_INFO__
const version = pkg.version

// 配置 logo, 空则默认 /logo.svg；依赖 getDarkMode 以在系统切暗色时切换 logoDark
const logoUrl = computed(() => {
  void websiteConfig.value
  void getDarkMode.value
  return getLogoUrl()
})

// 有 systemName 用配置, 否则 i18n 欢迎语
const titleText = computed(() => {
  void websiteConfig.value
  const name = getSystemName()
  return name || t('home.welcome')
})
</script>

<template>
  <div class="home">
    <div class="home__body">
      <div class="home__welcome">
        <!-- 站点 logo(配置优先, 默认 public/logo.svg) -->
        <img class="home__logo" :src="logoUrl" :alt="titleText">
        <!-- 欢迎语 / 系统名 -->
        <div class="home__title">
          {{ titleText }}
        </div>
      </div>
    </div>
    <!-- 底部: 站点页脚 + 工程版本信息 -->
    <div class="home__footer">
      <WebsiteFooter />
      <p>{{ t('home.version') }}: v{{ version }}</p>
      <p>{{ t('home.buildTime') }}: {{ lastBuildTime }}</p>
    </div>
  </div>
</template>

<style scoped lang="less">
.home {
  // 父级 RouterView 的 flex-1 已分配全高，min-height: 100vh 会撑破 flex 容器
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--h5-bg-page);

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
    color: var(--h5-text-primary);
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
    color: var(--h5-text-secondary);

    p {
      margin: 0;
    }
  }
}
</style>
