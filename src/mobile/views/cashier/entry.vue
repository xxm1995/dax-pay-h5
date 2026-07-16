<script lang="ts" setup>
/**
 * 收银台入口：UA 探测 clientEnv 后 replace 到环境页
 * 对外契约 URL 仍为 /cashier/:orderNo（预下单落地）
 */
import { onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { detectClientEnv } from '@/shared/utils/client-env'

defineOptions({ name: 'CashierEntry' })

const route = useRoute()
const router = useRouter()

// onBeforeMount 探测并 replace：挂载前跳走，模板不渲染 loading，避免转圈闪屏；
// 不用 setup 同步 replace，以免在当前导航未确认时触发新导航引发竞态（曾导致环境页结果卡片闪现后消失）
onBeforeMount(() => {
  const orderNo = route.params.orderNo as string
  if (!orderNo) {
    return
  }
  const clientEnv = detectClientEnv()
  // replace：避免返回键再次落到入口造成死循环
  router.replace({
    name: 'CashierEnvPage',
    params: { orderNo, clientEnv },
  })
})
</script>

<template>
  <!-- 入口不渲染可见 UI：探测后立即 replace，避免 loading 转圈闪屏 -->
  <div class="cashier-entry" />
</template>

<style scoped>
.cashier-entry {
  min-height: 40vh;
}
</style>
