<template>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import router from '@/router'

const route = useRoute()
const { orderNo } = route.params

const ua = navigator.userAgent

onMounted(()=>{

})

</script>

<style scoped lang="less">
</style>
