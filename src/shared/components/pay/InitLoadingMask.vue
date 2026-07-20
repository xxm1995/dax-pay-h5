<script lang="ts" setup>
/**
 * 统一的全屏初始化 Loading 遮罩
 *
 * 用于聚合扫码 / 收银台 / 码牌页的初始化、OAuth 授权跳转、支付发起等阶段的视觉占位，
 * 消除「页面闪好几下」的视觉跳变（点阵 loading / van-loading / 品牌色 loading 来回切）。
 *
 * 设计要点：
 *  - fixed 全屏遮罩，z-index 极高，盖住所有业务内容
 *  - 旋转圈使用品牌色，文案随阶段切换（加载中 / 授权中 / 支付中）
 *  - 不依赖 Vant，纯 CSS 实现，移动端 / PC 端通用
 *  - fade 过渡，遮罩出现 / 消失都平滑
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'InitLoadingMask' })

const props = withDefaults(defineProps<{
  /** 品牌色（旋转圈与文案色），默认主题色 */
  brandColor?: string
  /** 阶段化文案 i18n key（不传则只显示转圈，无文案） */
  tipKey?: string
  /** 品牌 Logo（可选，展示在旋转圈上方） */
  logoSrc?: string
}>(), {
  brandColor: 'var(--app-theme-color, #5d9dfe)',
  tipKey: '',
  logoSrc: '',
})

const { t } = useI18n()

// 阶段文案：tipKey 为空时不渲染文案行
const tipText = computed(() => (props.tipKey ? t(props.tipKey) : ''))
</script>

<template>
  <div class="init-loading-mask" :style="{ '--mask-brand': brandColor }">
    <div class="init-loading-mask__inner">
      <img v-if="logoSrc" class="init-loading-mask__logo" :src="logoSrc" alt="">
      <div class="init-loading-mask__spinner">
        <span class="init-loading-mask__dot" />
        <span class="init-loading-mask__dot" />
        <span class="init-loading-mask__dot" />
      </div>
      <p v-if="tipText" class="init-loading-mask__tip">
        {{ tipText }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.init-loading-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--h5-bg-page, #f7f8fa);
  animation: init-loading-fade-in 0.2s ease-out;
}

.init-loading-mask__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
}

.init-loading-mask__logo {
  display: block;
  width: 56px;
  height: 56px;
  object-fit: contain;
  border-radius: 12px;
  margin-bottom: 4px;
}

.init-loading-mask__spinner {
  display: flex;
  gap: 8px;
}

.init-loading-mask__dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--mask-brand);
  animation: init-loading-bounce 1s infinite ease-in-out both;
}

.init-loading-mask__dot:nth-child(1) {
  animation-delay: -0.32s;
}

.init-loading-mask__dot:nth-child(2) {
  animation-delay: -0.16s;
}

.init-loading-mask__tip {
  margin: 0;
  font-size: 14px;
  color: var(--h5-text-secondary, #969799);
  letter-spacing: 0.2px;
  text-align: center;
}

@keyframes init-loading-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes init-loading-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
