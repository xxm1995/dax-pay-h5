<script lang="ts" setup>
/**
 * 支付方式图标（彩色品牌 SVG，与配置 icon / PayProvider 编码对齐）
 * 未知编码使用中性占位，禁止回落为伪微信图标
 */
import { computed } from 'vue'

import aggregatePaySvg from '@/shared/assets/icons/channel/aggregate_pay.svg'
import alipaySvg from '@/shared/assets/icons/channel/alipay.svg'
import douyinSvg from '@/shared/assets/icons/channel/douyin.svg'
import mastercardSvg from '@/shared/assets/icons/channel/mastercard.svg'
import otherSvg from '@/shared/assets/icons/channel/other.svg'
import stripeSvg from '@/shared/assets/icons/channel/stripe.svg'
import unionPaySvg from '@/shared/assets/icons/channel/union_pay.svg'
import visaSvg from '@/shared/assets/icons/channel/visa.svg'
import wechatSvg from '@/shared/assets/icons/channel/wechat.svg'

const props = withDefaults(defineProps<{
  /** 图标编码: wechat / alipay / union_pay / douyin / aggregate_pay / visa / mastercard / stripe */
  icon?: string
  /** 图标显示边长(px)，容器略大以留内边距 */
  size?: number
}>(), {
  icon: '',
  size: 28,
})

/** icon code → 品牌 SVG 资源 */
const ICON_MAP: Record<string, string> = {
  wechat: wechatSvg,
  alipay: alipaySvg,
  union_pay: unionPaySvg,
  douyin: douyinSvg,
  aggregate_pay: aggregatePaySvg,
  visa: visaSvg,
  mastercard: mastercardSvg,
  stripe: stripeSvg,
}

const src = computed(() => {
  const code = (props.icon || '').trim()
  if (code && ICON_MAP[code]) {
    return ICON_MAP[code]
  }
  // 未知编码: 中性占位，不伪装成微信
  return otherSvg
})

const containerSize = computed(() => props.size + 12)
</script>

<template>
  <span
    class="pay-method-icon"
    :style="{ width: `${containerSize}px`, height: `${containerSize}px` }"
    :title="icon || undefined"
  >
    <img
      class="pay-method-icon__img"
      :src="src"
      :width="size"
      :height="size"
      alt=""
      draggable="false"
    >
  </span>
</template>

<style scoped>
.pay-method-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--h5-bg-muted);
  flex-shrink: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.pay-method-icon__img {
  display: block;
  object-fit: contain;
  user-select: none;
  pointer-events: none;
}
</style>
