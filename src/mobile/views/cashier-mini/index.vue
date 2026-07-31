<script lang="ts" setup>
/**
 * 统一收银台小程序引导页（/cm/:orderNo）
 * 浏览器直接打开时展示扫码提示；微信普通链接二维码正常命中小程序时不会进入此页。
 */
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { closeWebview } from '@/shared/pay/close-webview'
import { useMiniGuideEnv } from '@/shared/pay/use-mini-guide-env'

defineOptions({ name: 'CashierMiniGuidePage' })

const { t } = useI18n()
const route = useRoute()
// 订单号来自路由参数
const orderNo = (route.params.orderNo as string) || ''
// 收银台小程序引导文案
const { icons, titleKey, descKey } = useMiniGuideEnv('cashier')
</script>

<template>
  <div class="cashier-mini">
    <!-- 品牌顶栏，与 H5 收银台保持一致 -->
    <div class="cashier-mini__brand" />

    <div class="cashier-mini__panel">
      <!-- 钱包图标 -->
      <div class="cashier-mini__wallets">
        <img
          v-for="item in icons"
          :key="item.altKey"
          class="cashier-mini__wallet-img"
          :src="item.src"
          :alt="t(item.altKey)"
          width="40"
          height="40"
        >
      </div>

      <!-- 引导文案 -->
      <h1 class="cashier-mini__title">
        {{ t(titleKey) }}
      </h1>
      <p class="cashier-mini__desc">
        {{ t(descKey) }}
      </p>

      <!-- 订单号弱展示 -->
      <p v-if="orderNo" class="cashier-mini__order">
        {{ t('cashier.orderNo') }} {{ orderNo }}
      </p>

      <!-- 关闭页面 -->
      <van-button class="cashier-mini__close" round block type="primary" @click="closeWebview">
        {{ t('cashier.closePage') }}
      </van-button>
    </div>
  </div>
</template>

<style scoped>
.cashier-mini {
  min-height: 100%;
  padding-bottom: 40px;
  box-sizing: border-box;
  background: var(--h5-bg-page);
}

.cashier-mini__brand {
  height: 120px;
  background: linear-gradient(135deg, var(--h5-brand-cashier), var(--h5-brand-cashier-deep));
}

.cashier-mini__panel {
  margin: -48px 16px 0;
  padding: 28px 20px 24px;
  position: relative;
  z-index: 1;
  border-radius: 20px;
  background: var(--h5-bg-card);
  box-shadow: 0 8px 24px rgb(0 0 0 / 8%);
  text-align: center;
}

.cashier-mini__wallets {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.cashier-mini__wallet-img {
  display: block;
  width: 40px;
  height: 40px;
}

.cashier-mini__title {
  margin: 24px 0 0;
  color: var(--h5-text-primary);
  font-size: 22px;
  line-height: 1.4;
  font-weight: 600;
}

.cashier-mini__desc {
  margin: 12px 0 0;
  color: var(--h5-text-secondary);
  font-size: 14px;
  line-height: 1.7;
}

.cashier-mini__order {
  margin: 16px 0 0;
  color: var(--h5-text-tertiary);
  font-size: 12px;
  line-height: 1.5;
  word-break: break-all;
}

.cashier-mini__close {
  margin-top: 20px;
  --van-button-primary-background: var(--h5-brand-cashier);
  --van-button-primary-border-color: var(--h5-brand-cashier);
  color: #fff;
  font-weight: 600;
}
</style>
