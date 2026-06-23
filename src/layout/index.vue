<template>
  <div
    class="layout-shell h-screen flex flex-col"
    :class="{ dark: designStore.darkMode === 'dark' }"
  >
    <RouterView class="flex-1 overflow-x-hidden">
      <template #default="{ Component, route }">
        <KeepAlive v-if="keepAliveComponents" :include="keepAliveComponents">
          <component :is="Component" :key="route.fullPath" />
        </KeepAlive>
        <component :is="Component" v-else :key="route.fullPath" />
      </template>
    </RouterView>

    <FloatingNavBar :items="tabbarItems" :show-dark-mode-toggle="true" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FloatingNavBar from './components/FloatingNavBar.vue'
import { useRouteStore } from '@/store/modules/route'
import { useDesignSettingStore } from '@/store/modules/designSetting'

const routeStore = useRouteStore()
const designStore = useDesignSettingStore()

const keepAliveComponents = computed(() => routeStore.keepAliveComponents)

const tabbarItems = [
  { label: 'Home', path: '/home/index', icon: 'i-ph:house-line' },
  { label: 'Theme', path: '/themeSetting', icon: 'i-ph:palette' },
]
</script>

<style scoped lang="less">
.layout-shell {
  background: #f7f8fa;
}

.layout-shell.dark {
  background: #000000;
}
</style>
