<script setup lang="ts">
import { computed } from 'vue'
import { useRouteStore } from '@/shared/store/modules/route'

defineOptions({ name: 'BasicLayout' })

const routeStore = useRouteStore()

const keepAliveComponents = computed(() => routeStore.keepAliveComponents)
</script>

<template>
  <div
    class="layout-shell h-screen flex flex-col"
  >
    <RouterView class="flex-1 overflow-x-hidden">
      <template #default="{ Component, route }">
        <!-- 空数组 [] 仍为 truthy，须用 length，否则永远走 KeepAlive 分支 -->
        <KeepAlive v-if="keepAliveComponents.length" :include="keepAliveComponents">
          <component :is="Component" :key="route.fullPath" />
        </KeepAlive>
        <component :is="Component" v-else :key="route.fullPath" />
      </template>
    </RouterView>
  </div>
</template>

<style scoped lang="less">
.layout-shell {
  background: var(--h5-bg-page);
}
</style>
