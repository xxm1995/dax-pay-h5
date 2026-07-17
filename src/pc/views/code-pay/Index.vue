<script lang="ts" setup>
/**
 * PC 码牌落地：引导手机钱包扫码（Web 居中白卡，对齐 PC 聚合 unsupported）
 * 码牌收款仅在微信/支付宝移动端完成，PC 只做扫码提示。
 */
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import alipaySvg from '@/shared/assets/icons/channel/alipay.svg'
import douyinSvg from '@/shared/assets/icons/channel/douyin.svg'
import unionPaySvg from '@/shared/assets/icons/channel/union_pay.svg'
import wechatSvg from '@/shared/assets/icons/channel/wechat.svg'

defineOptions({ name: 'PcCodePay' })

const { t } = useI18n()
const route = useRoute()
// 路由 /h/:code 或 /h/wechat|alipay/:code
const code = (route.params.code as string) || ''

/** 四钱包图标 */
const walletIcons = [
  { src: wechatSvg, altKey: 'codePay.wallet.wechat' },
  { src: alipaySvg, altKey: 'codePay.wallet.alipay' },
  { src: unionPaySvg, altKey: 'codePay.wallet.union' },
  { src: douyinSvg, altKey: 'codePay.wallet.douyin' },
]
</script>

<template>
  <div class="pc-code-pay">
    <div class="pc-code-pay__card">
      <div class="pc-code-pay__icons">
        <img
          v-for="icon in walletIcons"
          :key="icon.altKey"
          :src="icon.src"
          :alt="t(icon.altKey)"
          class="pc-code-pay__icon"
          width="40"
          height="40"
        >
      </div>
      <!-- 请使用钱包扫码（加粗主标题，与聚合共用 key） -->
      <h1 class="pc-code-pay__title">
        {{ t('aggregate.unsupportedTitle') }}
      </h1>
      <!-- 请使用微信、支付宝、云闪付或抖音扫描二维码完成支付 -->
      <p class="pc-code-pay__desc">
        {{ t('aggregate.unsupportedDesc') }}
      </p>
      <p v-if="code" class="pc-code-pay__code">
        {{ t('codePay.codeLabel') }} {{ code }}
      </p>
    </div>
  </div>
</template>

<style scoped>
/* PC：scoped 原生 px，禁止 UnoCSS 长度类 */
.pc-code-pay {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  box-sizing: border-box;
  background: #f5f7fa;
}

.pc-code-pay__card {
  width: 100%;
  max-width: 480px;
  padding: 40px 36px 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgb(0 0 0 / 8%);
  text-align: center;
  box-sizing: border-box;
}

.pc-code-pay__icons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin-bottom: 20px;
}

.pc-code-pay__icon {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: contain;
}

/* 与 PC 聚合 unsupported 标题/副文案层级一致 */
.pc-code-pay__title {
  margin: 0 0 10px;
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.4;
}

.pc-code-pay__desc {
  margin: 0;
  font-size: 14px;
  color: #86909c;
  line-height: 1.7;
}

.pc-code-pay__code {
  margin: 20px 0 0;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #c0c4cc;
  word-break: break-all;
  line-height: 1.5;
}
</style>
