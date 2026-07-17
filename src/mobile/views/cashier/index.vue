<script lang="ts" setup>
/**
 * 兼容旧引用：收银台逻辑已拆为 entry + CashierEnvPage
 * 若有静态 import 本文件，重定向到入口
 */
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

defineOptions({ name: 'CashierPageLegacy' })

const route = useRoute()
const router = useRouter()

onMounted(() => {
  router.replace({
    name: 'CashierEntry',
    params: { orderNo: route.params.orderNo as string },
  })
})
</script>

<template>
  <div />
</template>
