<script lang="ts" setup>
/**
 * PC 统一收银台小程序引导页（/cm/:orderNo）
 * PC 浏览器直接打开时展示扫码提示，不发起收银台支付。
 */
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { closeWebview } from '@/shared/pay/close-webview'
import { useMiniGuideEnv } from '@/shared/pay/use-mini-guide-env'

defineOptions({ name: 'PcCashierMiniGuidePage' })

const { t } = useI18n()
const route = useRoute()
// 订单号来自路由参数
const orderNo = (route.params.orderNo as string) || ''
// 收银台小程序引导文案
const { icons, titleKey, descKey } = useMiniGuideEnv('cashier')
</script>

<template>
  <div class="cashier-mini">
    <!-- 品牌顶栏 -->
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
      <button class="cashier-mini__close" type="button" @click="closeWebview">
        {{ t('cashier.closePage') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.cashier-mini {
  min-height: 100vh;
  padding-bottom: 40px;
  box-sizing: border-box;
  background: var(--h5-bg-page);
}

.cashier-mini__brand {
  height: 180px;
  background: linear-gradient(135deg, var(--h5-brand-cashier), var(--h5-brand-cashier-deep));
}

.cashier-mini__panel {
  width: min(520px, calc(100% - 48px));
  margin: -72px auto 0;
  padding: 40px 48px 36px;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
  border-radius: 24px;
  background: var(--h5-bg-card);
  box-shadow: 0 12px 32px rgb(0 0 0 / 8%);
  text-align: center;
}

.cashier-mini__wallets {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.cashier-mini__wallet-img {
  display: block;
  width: 40px;
  height: 40px;
}

.cashier-mini__title {
  margin: 28px 0 0;
  color: var(--h5-text-primary);
  font-size: 28px;
  line-height: 1.4;
  font-weight: 600;
}

.cashier-mini__desc {
  margin: 16px 0 0;
  color: var(--h5-text-secondary);
  font-size: 16px;
  line-height: 1.7;
}

.cashier-mini__order {
  margin: 20px 0 0;
  color: var(--h5-text-tertiary);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;
}

.cashier-mini__close {
  width: 280px;
  max-width: 100%;
  height: 44px;
  margin-top: 24px;
  border: none;
  border-radius: 22px;
  background: linear-gradient(135deg, var(--h5-brand-cashier), var(--h5-brand-cashier-deep));
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.cashier-mini__close:hover {
  opacity: 0.9;
}

@media (max-width: 640px) {
  .cashier-mini__panel {
    width: calc(100% - 32px);
    padding: 32px 24px 28px;
  }

  .cashier-mini__title {
    font-size: 24px;
  }
}
</style>
