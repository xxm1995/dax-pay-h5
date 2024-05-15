<template>
  <van-loading
    class="loading-overlay"
    :text-color="textColor"
    :color="color"
    :size="size"
    :text-size="textSize"
    vertical
  >
    {{ text }}
  </van-loading>
</template>

<script setup lang="ts">
defineProps({
  text: {
    type: String,
    default: '加载中...',
  },
  color: {
    type: String,
    default: '#1172d5',
  },
  textColor: {
    type: String,
    default: '#fff',
  },
  size: {
    type: Number,
    default: 50,
  },
  textSize: {
    type: Number,
    default: 18,
  },
})
</script>

<style scoped lang="less"></style>
