<template>
  <div> 跳转中... </div>
</template>

<script setup lang="ts">
// 获取路由参数
import { useRouter } from 'vue-router'
import { onMounted } from 'vue'
import { getRouterByKey } from './Dispatch.api'
import router from '@/router'

const { currentRoute } = useRouter()
const { params } = unref(currentRoute)

onMounted(() => {
  const key = params.key as string
  getRouterByKey(key).then(({ data }) => {
    console.log(data)
    router.push({
      name: data.route,
      query: { data: data.data },
    })
  })
})
</script>

<style scoped></style>
