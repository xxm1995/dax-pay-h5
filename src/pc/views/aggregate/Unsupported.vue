<script lang="ts" setup>
/**
 * PC 直开 /aggregate/unsupported 时的静态引导（Web 白卡风格）
 * 不请求订单（避免 path 段 "unsupported" 被当成 orderNo 查单）
 */
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import alipaySvg from '@/shared/assets/icons/channel/alipay.svg'
import douyinSvg from '@/shared/assets/icons/channel/douyin.svg'
import unionPaySvg from '@/shared/assets/icons/channel/union_pay.svg'
import wechatSvg from '@/shared/assets/icons/channel/wechat.svg'

defineOptions({ name: 'PcAggregateUnsupported' })

const { t } = useI18n()
const route = useRoute()
// 可选：来自 Entry 跳转时的 query
const orderNo = (route.query.orderNo as string) || ''

const walletIcons = [
  { src: wechatSvg, alt: 'WeChat' },
  { src: alipaySvg, alt: 'Alipay' },
  { src: unionPaySvg, alt: 'UnionPay' },
  { src: douyinSvg, alt: 'Douyin' },
]
</script>

<template>
  <div class="pc-agg-unsup">
    <div class="pc-agg-unsup__card">
      <div class="pc-agg-unsup__icons">
        <img
          v-for="icon in walletIcons"
          :key="icon.alt"
          :src="icon.src"
          :alt="icon.alt"
          class="pc-agg-unsup__icon"
          width="40"
          height="40"
        >
      </div>
      <!-- 请使用钱包扫码 -->
      <h1 class="pc-agg-unsup__title">
        {{ t('aggregate.unsupportedTitle') }}
      </h1>
      <!-- 请使用微信、支付宝等扫码完成支付 -->
      <p class="pc-agg-unsup__desc">
        {{ t('aggregate.unsupportedDesc') }}
      </p>
      <p v-if="orderNo" class="pc-agg-unsup__order">
        {{ t('aggregate.orderNo') }} {{ orderNo }}
      </p>
    </div>
  </div>
</template>

<style scoped>
/* PC：scoped 原生 px，禁止 UnoCSS 长度类 */
.pc-agg-unsup {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  box-sizing: border-box;
  background: #f5f7fa;
}

.pc-agg-unsup__card {
  width: 100%;
  max-width: 480px;
  padding: 40px 36px 32px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgb(0 0 0 / 8%);
  text-align: center;
  box-sizing: border-box;
}

.pc-agg-unsup__icons {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin-bottom: 20px;
}

.pc-agg-unsup__icon {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.pc-agg-unsup__title {
  margin: 0 0 10px;
  font-size: 20px;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.4;
}

.pc-agg-unsup__desc {
  margin: 0;
  font-size: 14px;
  color: #86909c;
  line-height: 1.7;
}

.pc-agg-unsup__order {
  margin: 20px 0 0;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #c0c4cc;
  word-break: break-all;
  line-height: 1.5;
}
</style>
