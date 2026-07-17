<script lang="ts" setup>
/**
 * 聚合扫码入口：UA 探测后 replace 到分环境页
 * 对外契约 URL 仍为 /aggregate/:orderNo
 */
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { detectAggregateClientEnv } from '@/shared/utils/client-env'

defineOptions({ name: 'AggregateEntry' })

const route = useRoute()
const router = useRouter()

/** clientEnv → 路由 name */
const ENV_ROUTE_NAME: Record<string, string> = {
  wechat: 'AggregateWechat',
  alipay: 'AggregateAlipay',
  union_pay: 'AggregateUnion',
  douyin: 'AggregateDouyin',
}

onMounted(() => {
  const orderNo = route.params.orderNo as string
  if (!orderNo) {
    return
  }
  const clientEnv = detectAggregateClientEnv()
  if (!clientEnv) {
    // 非宿主：提示页
    router.replace({
      name: 'AggregateUnsupported',
      query: { orderNo },
    })
    return
  }
  // replace：避免返回键再次落到入口造成死循环
  router.replace({
    name: ENV_ROUTE_NAME[clientEnv],
    params: { orderNo },
  })
})
</script>

<template>
  <div class="aggregate-entry">
    <van-loading color="#5d9dfe" size="24px" />
  </div>
</template>

<style scoped>
.aggregate-entry {
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
