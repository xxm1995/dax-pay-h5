<template>
  <div
    class="layout-shell h-screen flex flex-col"
    :class="{ dark: designStore.getDarkMode === 'dark' }"
  >
    <RouterView class="flex-1 overflow-x-hidden">
      <template #default="{ Component, route }">
        <KeepAlive v-if="keepAliveComponents" :include="keepAliveComponents">
          <component :is="Component" :key="route.fullPath" />
        </KeepAlive>
        <component :is="Component" v-else :key="route.fullPath" />
      </template>
    </RouterView>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDesignSettingStore } from '@/store/modules/designSetting'
import { useRouteStore } from '@/store/modules/route'

const routeStore = useRouteStore()
const designStore = useDesignSettingStore()

const keepAliveComponents = computed(() => routeStore.keepAliveComponents)
</script>

<style scoped lang="less">
.layout-shell {
  background: #f7f8fa;
}

.layout-shell.dark {
  background: #1c1c1e;
}
</style>
