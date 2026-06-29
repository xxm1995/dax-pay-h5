<script setup lang="ts">
import { useLocale } from '@/shared/locales'

defineOptions({ name: 'PcApp' })

// PC 端 vant 组件（如收银台、协议页的 Dialog/NavBar）语言包，跟随当前语言
const { vantLocale } = useLocale()
</script>

<template>
  <vanConfigProvider :locale="vantLocale">
    <RouterView />
  </vanConfigProvider>
</template>
