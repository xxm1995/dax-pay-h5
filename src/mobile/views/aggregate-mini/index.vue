<script lang="ts" setup>
/**
 * 聚合小程序引导页（/am/:orderNo）
 * 系统浏览器打开:展示"请扫码支付";钱包 App 内打开(小程序未拉起):展示"小程序暂不可用"。
 * UA 分流由 useMiniGuideEnv 处理。微信/支付宝扫码正常时由「普通链接二维码」规则拉起小程序。
 * 视觉结构与 aggregate/unsupported.vue 对齐（品牌条 + 上浮卡）。
 */
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { closeWebview } from '@/shared/pay/close-webview'
import { useMiniGuideEnv } from '@/shared/pay/use-mini-guide-env'

defineOptions({ name: 'AggregateMiniGuidePage' })

const { t } = useI18n()
const route = useRoute()
// 订单号来自路由参数
const orderNo = (route.params.orderNo as string) || ''

// UA 感知:钱包内显示"小程序暂不可用"+当前钱包图标;否则"请扫码支付"+四钱包
const { icons, titleKey, descKey } = useMiniGuideEnv()
</script>

<template>
  <div class="agg-mini">
    <!-- 品牌顶栏，与聚合环境页一致 -->
    <div class="agg-mini__brand" />

    <div class="agg-mini__panel">
      <!-- 四钱包图标：仅图标横排 -->
      <div class="agg-mini__wallets">
        <img
          v-for="item in icons"
          :key="item.altKey"
          class="agg-mini__wallet-img"
          :src="item.src"
          :alt="t(item.altKey)"
          width="40"
          height="40"
        >
      </div>

      <!-- 标题(UA 感知:钱包内为"小程序暂不可用") -->
      <h1 class="agg-mini__title">
        {{ t(titleKey) }}
      </h1>
      <!-- 描述(UA 感知) -->
      <p class="agg-mini__desc">
        {{ t(descKey) }}
      </p>

      <!-- 订单号弱展示 -->
      <p v-if="orderNo" class="agg-mini__order">
        {{ t('aggregate.orderNo') }} {{ orderNo }}
      </p>
      <!-- 关闭页面 -->
      <van-button
        class="agg-mini__close"
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
.agg-mini {
  min-height: 100%;
  padding-bottom: 40px;
  background: var(--h5-bg-page);
  box-sizing: border-box;
}

.agg-mini__brand {
  height: 120px;
  background: linear-gradient(135deg, var(--h5-brand-cashier), var(--h5-brand-cashier-deep));
}

.agg-mini__panel {
  margin: -48px 16px 0;
  padding: 28px 20px 24px;
  background: var(--h5-bg-card);
  border-radius: 12px;
  box-shadow: var(--h5-shadow-card);
  text-align: center;
  box-sizing: border-box;
}

.agg-mini__wallets {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 18px;
}

.agg-mini__wallet-img {
  display: block;
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 10px;
}

.agg-mini__title {
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 600;
  color: var(--h5-text-primary);
  line-height: 1.4;
}

.agg-mini__desc {
  margin: 0;
  font-size: 13px;
  color: var(--h5-text-secondary);
  line-height: 1.65;
  padding: 0 4px;
}

.agg-mini__order {
  margin: 16px 0 0;
  font-size: 12px;
  color: var(--h5-text-placeholder);
  word-break: break-all;
  line-height: 1.5;
}

.agg-mini__close {
  margin-top: 20px;
  --van-button-primary-background: var(--h5-brand-cashier);
  --van-button-primary-border-color: var(--h5-brand-cashier);
  color: #fff;
  font-weight: 600;
}
</style>
