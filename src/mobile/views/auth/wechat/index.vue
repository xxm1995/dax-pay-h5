<script lang="ts" setup>
/**
 * 微信 OAuth 重定向回调落地页(薄壳)
 *
 * 实际逻辑由 AuthCallback 共享组件承载, 本文件仅声明组件 name 与通道,
 * 便于路由 name 对齐与未来按通道独立拆分
 */
import AuthCallback from '@/mobile/views/auth/AuthCallback.vue'

defineOptions({ name: 'WechatAuthPage' })
</script>

<template>
  <AuthCallback channel="wechat" />
</template>
