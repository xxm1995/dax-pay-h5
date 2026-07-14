<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import beianIcon from '@/shared/assets/system/beian.png'
import icpIcon from '@/shared/assets/system/icp.png'
import zfIcon from '@/shared/assets/system/zf.png'
import zzIcon from '@/shared/assets/system/zz.png'
import {
  getCompanyEmail,
  getCompanyPhone,
  getCompanyWechat,
  getCopyright,
  getIcpInfo,
  getIcpLink,
  getIcpPlusInfo,
  getIcpPlusLink,
  getMpsInfo,
  getMpsLink,
  getPcacInfo,
  getPcacLink,
  hasWebsiteFooterContent,
  websiteConfig,
} from '@/shared/logics/init-website-config'

defineOptions({ name: 'WebsiteFooter' })

const { t } = useI18n()

const year = new Date().getFullYear()

const visible = computed(() => {
  void websiteConfig.value
  return hasWebsiteFooterContent()
})

const phone = computed(() => {
  void websiteConfig.value
  return getCompanyPhone()
})
const email = computed(() => {
  void websiteConfig.value
  return getCompanyEmail()
})
const wechat = computed(() => {
  void websiteConfig.value
  return getCompanyWechat()
})
const copyright = computed(() => {
  void websiteConfig.value
  return getCopyright()
})

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
  const pcac = getPcacInfo()
  if (pcac) {
    items.push({ icon: zfIcon, text: pcac, link: getPcacLink() })
  }
  const icpPlus = getIcpPlusInfo()
  if (icpPlus) {
    items.push({ icon: zzIcon, text: icpPlus, link: getIcpPlusLink() })
  }
  return items
})

const hasContact = computed(() => !!(phone.value || email.value || wechat.value))
</script>

<template>
  <div v-if="visible" class="website-footer">
    <div v-if="hasContact" class="website-footer__contact">
      <span v-if="phone">{{ t('home.footerPhone') }}{{ phone }}</span>
      <span v-if="email">
        {{ t('home.footerEmail') }}
        <a :href="`mailto:${email}`" class="website-footer__link">{{ email }}</a>
      </span>
      <span v-if="wechat">{{ t('home.footerWechat') }}{{ wechat }}</span>
    </div>
    <div v-if="copyright" class="website-footer__copyright">
      Copyright © {{ year }}
      <span class="website-footer__brand">{{ copyright }}</span>
    </div>
    <div v-if="filings.length" class="website-footer__filings">
      <a
        v-for="item in filings"
        :key="item.text"
        class="website-footer__filing"
        :href="item.link || 'javascript:void(0)'"
        :target="item.link ? '_blank' : undefined"
        rel="noopener noreferrer"
      >
        <img :src="item.icon" alt="" class="website-footer__filing-icon">
        <span>{{ item.text }}</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
/* 尺寸用相对单位, mobile 侧由 less 进 mobile-forever; PC 首页单独覆盖时可包一层 */
.website-footer {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  line-height: 1.6;
  color: rgb(0 0 0 / 45%);
}

.website-footer__contact {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  justify-content: center;
}

.website-footer__copyright {
  text-align: center;
}

.website-footer__brand {
  margin-left: 4px;
}

.website-footer__link {
  color: inherit;
  text-decoration: none;
}

.website-footer__filings {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  justify-content: center;
}

.website-footer__filing {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  color: inherit;
  text-decoration: none;
}

.website-footer__filing-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
}
</style>
