<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import WebsiteFooter from '@/shared/components/WebsiteFooter.vue'
import {
  getLogoUrl,
  getSystemName,
  websiteConfig,
} from '@/shared/logics/init-website-config'

defineOptions({ name: 'PcHome' })

const { t } = useI18n()

// 由 vite define 注入的项目信息（与移动端首页一致）
const { pkg, lastBuildTime } = __APP_INFO__
const version = pkg.version

const logoUrl = computed(() => {
  void websiteConfig.value
  return getLogoUrl()
})

const titleText = computed(() => {
  void websiteConfig.value
  const name = getSystemName()
  return name || t('home.welcome')
})
</script>

<template>
  <div class="pc-home">
    <div class="pc-home__body">
      <div class="pc-home__welcome">
        <!-- 站点 logo(配置优先, 默认 public/logo.svg) -->
        <img class="pc-home__logo" :src="logoUrl" :alt="titleText">
        <div class="pc-home__title">
          {{ titleText }}
        </div>
      </div>
    </div>
    <div class="pc-home__footer">
      <WebsiteFooter />
      <p>{{ t('home.version') }}: v{{ version }}</p>
      <p>{{ t('home.buildTime') }}: {{ lastBuildTime }}</p>
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
  width: 200px;
  height: auto;
}

.pc-home__title {
  margin-top: 16px;
  text-align: center;
  font-size: 28px;
  font-weight: 900;
  color: #303133;
}

.pc-home__footer {
  position: fixed;
  bottom: 32px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  line-height: 1.6;
  color: rgb(0 0 0 / 45%);
}

.pc-home__footer p {
  margin: 0;
}

/* PC 页脚组件内尺寸保持 px, 不被 vw 转换(组件在 shared, 但本页 scoped 不穿透;
   WebsiteFooter 自身用 12px, PC 可接受; 若被 mobile-forever 误转则依赖 postcss exclude) */
@media (max-width: 768px) {
  .pc-home__logo {
    width: 160px;
  }

  .pc-home__title {
    font-size: 24px;
  }
}
</style>
