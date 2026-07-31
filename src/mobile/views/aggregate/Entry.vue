<script lang="ts" setup>
/**
 * 聚合扫码入口：UA 探测后 replace 到分环境页
 * 对外契约 URL 仍为 /aggregate/:orderNo
 */
import { onBeforeMount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { detectAggregateClientEnv } from '@/shared/utils/client-env'

defineOptions({ name: 'AggregateEntry' })

const route = useRoute()
const router = useRouter()

/** clientEnv → 路由 name（指向 Aggregate 父级下的环境页子路由，不跨顶层以避免 transition 竞争） */
const ENV_ROUTE_NAME: Record<string, string> = {
  wechat: 'AggregateWechatPage',
  alipay: 'AggregateAlipayPage',
  union_pay: 'AggregateUnionPage',
  douyin: 'AggregateDouyinPage',
}

// onBeforeMount 探测并 replace：挂载前跳走，避免与 App.vue <transition mode="out-in" appear> 的 enter 动画
// 发生竞争（onMounted 跳转曾导致 /aggregate/unsupported 首次打开白屏、刷新才正常）。
// 不用 setup 同步 replace，以免在当前导航未确认时触发新导航引发竞态（与 cashier/Entry.vue 同源结论）。
onBeforeMount(() => {
  const orderNo = route.params.orderNo as string
  if (!orderNo) {
    return
  }
  const clientEnv = detectAggregateClientEnv()
  if (!clientEnv) {
    // 非宿主：提示页（AggregateUnsupportedPage 与本入口同属 Aggregate 父级，
    // 避免跨顶层路由跳转触发 App.vue transition 整页 remount）
    router.replace({
      name: 'AggregateUnsupportedPage',
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
