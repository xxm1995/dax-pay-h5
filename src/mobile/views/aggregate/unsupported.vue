<script lang="ts" setup>
/**
 * 聚合扫码：非微信/支付宝/云闪付/抖音宿主提示
 * 结构对齐各环境页（品牌条 + 上浮卡）；四钱包仅图标、无标签，减少与描述重复
 */
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import alipaySvg from '@/shared/assets/icons/channel/alipay.svg'
import douyinSvg from '@/shared/assets/icons/channel/douyin.svg'
import unionPaySvg from '@/shared/assets/icons/channel/union_pay.svg'
import wechatSvg from '@/shared/assets/icons/channel/wechat.svg'
import { closeWebview } from '@/shared/pay/close-webview'

defineOptions({ name: 'AggregateUnsupportedPage' })

const { t } = useI18n()
const route = useRoute()
// 可选展示订单号（不查单）
const orderNo = (route.query.orderNo as string) || ''

/** 支持扫码的钱包图标（无文字标签，避免与 desc 重复） */
const walletIcons = [
  { src: wechatSvg, altKey: 'aggregate.clientEnv.wechat' },
  { src: alipaySvg, altKey: 'aggregate.clientEnv.alipay' },
  { src: unionPaySvg, altKey: 'aggregate.clientEnv.union' },
  { src: douyinSvg, altKey: 'aggregate.clientEnv.douyin' },
]
</script>

<template>
  <div class="agg-unsup">
    <!-- 品牌顶栏，与聚合环境页一致 -->
    <div class="agg-unsup__brand" />

    <div class="agg-unsup__panel">
      <!-- 四钱包图标：仅图标横排 -->
      <div class="agg-unsup__wallets">
        <img
          v-for="item in walletIcons"
          :key="item.altKey"
          class="agg-unsup__wallet-img"
          :src="item.src"
          :alt="t(item.altKey)"
          width="40"
          height="40"
        >
      </div>

      <!-- 请使用钱包扫码 -->
      <h1 class="agg-unsup__title">
        {{ t('aggregate.unsupportedTitle') }}
      </h1>
      <!-- 请使用微信、支付宝、云闪付或抖音扫描二维码完成支付 -->
      <p class="agg-unsup__desc">
        {{ t('aggregate.unsupportedDesc') }}
      </p>

      <!-- 订单号弱展示，无分割线表单区 -->
      <p v-if="orderNo" class="agg-unsup__order">
        {{ t('aggregate.orderNo') }} {{ orderNo }}
      </p>
      <!-- 关闭页面：实心收银蓝 -->
      <van-button
        class="agg-unsup__close"
        round
        block
        type="primary"
        @click="closeWebview"
      >
        {{ t('aggregate.closePage') }}
      </van-button>
    </div>
  </div>
</template>

<style scoped>
.agg-unsup {
  min-height: 100%;
  padding-bottom: 40px;
  background: var(--h5-bg-page);
  box-sizing: border-box;
}

/* 与 EnvPage brand 一致 */
.agg-unsup__brand {
  height: 120px;
  background: linear-gradient(135deg, var(--h5-brand-cashier), var(--h5-brand-cashier-deep));
}

/* 上浮内容区：全宽贴边 */
.agg-unsup__panel {
  margin: -48px 16px 0;
  padding: 28px 20px 24px;
  background: var(--h5-bg-card);
  border-radius: 12px;
  box-shadow: var(--h5-shadow-card);
  text-align: center;
  box-sizing: border-box;
}

.agg-unsup__wallets {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 18px;
}

.agg-unsup__wallet-img {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 10px;
}

.agg-unsup__title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 600;
  color: var(--h5-text-primary);
  line-height: 1.4;
}

.agg-unsup__desc {
  margin: 0;
  font-size: 13px;
  color: var(--h5-text-secondary);
  line-height: 1.65;
  padding: 0 4px;
}

.agg-unsup__order {
  margin: 16px 0 0;
  font-size: 12px;
  color: var(--h5-text-placeholder);
  word-break: break-all;
  line-height: 1.5;
}

.agg-unsup__close {
  margin-top: 20px;
  --van-button-primary-background: var(--h5-brand-cashier);
  --van-button-primary-border-color: var(--h5-brand-cashier);
  color: #fff;
  font-weight: 600;
}
</style>
