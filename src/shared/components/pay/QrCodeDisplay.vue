<script lang="ts" setup>
/**
 * 二维码展示：将文本内容渲染为 canvas 二维码
 * 使用动态 import('qrcode')，未安装时回退展示原文
 */
import { onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  /** 二维码内容 */
  content: string
  /** 边长 px */
  size?: number
}>(), {
  size: 200,
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
const fallback = ref(false)
const errorMsg = ref('')

async function render() {
  fallback.value = false
  errorMsg.value = ''
  if (!props.content || !canvasRef.value) {
    return
  }
  try {
    // 动态加载 qrcode 包
    const mod = await import('qrcode')
    const QRCode = (mod as any).default ?? mod
    await QRCode.toCanvas(canvasRef.value, props.content, {
      width: props.size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
  }
  catch (e: any) {
    // 无 qrcode 依赖或渲染失败时回退文本
    fallback.value = true
    errorMsg.value = e?.message || 'qr render failed'
  }
}

onMounted(render)
watch(() => props.content, render)
watch(() => props.size, render)
</script>

<template>
  <div class="qr-code-display" :style="{ width: `${size}px`, height: `${size}px` }">
    <canvas
      v-show="!fallback"
      ref="canvasRef"
      class="qr-code-display__canvas"
    />
    <p v-if="fallback" class="qr-code-display__fallback">
      {{ content }}
    </p>
  </div>
</template>

<style scoped>
.qr-code-display {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  box-sizing: border-box;
}

.qr-code-display__canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
}

.qr-code-display__fallback {
  margin: 0;
  padding: 8px;
  font-size: 12px;
  word-break: break-all;
  color: #64748b;
  text-align: center;
  max-height: 100%;
  overflow: auto;
}
</style>
