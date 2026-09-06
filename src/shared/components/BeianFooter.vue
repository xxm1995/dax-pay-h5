<script setup lang="ts">
/**
 * 轻量备案栏(收银台/支付结果页/协议页用)
 *
 * 与完整版 WebsiteFooter 区分: 只展示 版权 + ICP 备案 + 公网安备案,
 * 不含联系方式与支付清算协会/电信增值许可(完整信息见首页页脚), 交易页保持克制。
 * 数据源为启动时已拉取的站点配置, 无需额外请求; 配置为空时整块不渲染。
 */
import { computed } from 'vue'
import beianIcon from '@/shared/assets/system/beian.png'
import icpIcon from '@/shared/assets/system/icp.png'
import {
  getCopyright,
  getIcpInfo,
  getIcpLink,
  getMpsInfo,
  getMpsLink,
  hasBeianFooterContent,
  websiteConfig,
} from '@/shared/logics/init-website-config'

defineOptions({ name: 'BeianFooter' })

const year = new Date().getFullYear()

const visible = computed(() => {
  void websiteConfig.value
  return hasBeianFooterContent()
})

const copyright = computed(() => {
  void websiteConfig.value
  return getCopyright()
})

// 备案项: 仅 ICP + 公网安, 逐项判空自动隐藏
const filings = computed(() => {
  void websiteConfig.value
  const items: { icon: string, text: string, link: string }[] = []
  const icp = getIcpInfo()
  if (icp) {
    items.push({ icon: icpIcon, text: icp, link: getIcpLink() })
  }
  const mps = getMpsInfo()
  if (mps) {
    items.push({ icon: beianIcon, text: mps, link: getMpsLink() })
  }
  return items
})
</script>

<template>
  <div v-if="visible" class="beian-footer">
    <p v-if="copyright" class="beian-footer__copyright">
      Copyright © {{ year }}
      <span class="beian-footer__brand">{{ copyright }}</span>
    </p>
    <div v-if="filings.length" class="beian-footer__filings">
      <a
        v-for="item in filings"
        :key="item.text"
        class="beian-footer__filing"
        :href="item.link || 'javascript:void(0)'"
        :target="item.link ? '_blank' : undefined"
        rel="noopener noreferrer"
      >
        <img :src="item.icon" alt="" class="beian-footer__filing-icon">
        <span>{{ item.text }}</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
/* 尺寸用相对单位, 与 WebsiteFooter 同策略: mobile 侧进 mobile-forever, PC 引用表现一致 */
.beian-footer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  line-height: 1.6;
  color: var(--h5-text-secondary);
}

.beian-footer__copyright {
  margin: 0;
  text-align: center;
}

.beian-footer__brand {
  margin-left: 4px;
}

.beian-footer__filings {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  justify-content: center;
}

.beian-footer__filing {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  color: inherit;
  text-decoration: none;
}

.beian-footer__filing-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
}
</style>
