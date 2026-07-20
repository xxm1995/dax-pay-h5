<script setup lang="ts">
import { useVantThemeVars } from '@/shared/hooks/setting/useVantThemeVars'
import { useLocale } from '@/shared/locales'

defineOptions({ name: 'PcApp' })

// PC 端 vant 组件（如收银台、协议页的 Dialog/NavBar）语言包，跟随当前语言
const { vantLocale } = useLocale()
// 跟随系统深浅色，驱动 vant ConfigProvider theme
const { getDarkMode, getThemeVars } = useVantThemeVars()
</script>

<template>
  <vanConfigProvider :theme="getDarkMode" :theme-vars="getThemeVars()" :locale="vantLocale">
    <RouterView />
  </vanConfigProvider>
</template>

<style lang="less">
  /* PC 与移动端共用语义色 Token + 全局暗色覆盖 */
@import '../shared/styles/index.less';
</style>
