<script lang="ts" setup>
/**
 * 码牌支付-微信端
 */
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import CodePayShell from '../shared/CodePayShell.vue'
import { useCodePayPage } from '../shared/useCodePayPage'

defineOptions({ name: 'CodePayWechat' })

const { t } = useI18n()
const route = useRoute()
const code = route.params.code as string

const {
  loading,
  paying,
  loadError,
  info,
  description,
  setDescription,
  displayAmount,
  paid,
  orderNo,
  authRedirecting,
  init,
  onInput,
  onDelete,
  pay,
  closePage,
} = useCodePayPage({ code, clientEnv: 'wechat' })

onMounted(() => {
  init()
})
</script>

<template>
  <div class="code-pay-page">
    <!-- 加载 / 授权中：品牌顶栏 + 上浮卡 -->
    <template v-if="loading || authRedirecting">
      <div class="code-pay-page__brand code-pay-page__brand--wechat" />
      <div class="code-pay-page__card">
        <van-loading color="#07c160" size="28px" />
        <!-- 正在授权 / 加载中 -->
        <p class="code-pay-page__tip">
          {{ authRedirecting ? t('codePay.authorizing') : t('codePay.loading') }}
        </p>
      </div>
    </template>

    <!-- 加载失败 -->
    <template v-else-if="loadError">
      <div class="code-pay-page__brand code-pay-page__brand--wechat" />
      <div class="code-pay-page__card">
        <div class="code-pay-page__error-icon">
          <van-icon name="warning-o" size="40" color="#fa8c16" />
        </div>
        <p class="code-pay-page__error-title">
          {{ t('codePay.loadFailTitle') }}
        </p>
        <p class="code-pay-page__error">
          {{ loadError }}
        </p>
      </div>
    </template>

    <CodePayShell
      v-else
      :merchant-name="info.name"
      :mch-short-name="info.mchShortName"
      :display-amount="displayAmount"
      :amount-type="info.amountType"
      :description="description"
      :paying="paying"
      :paid="paid"
      :order-no="orderNo"
      brand-color="#07c160"
      brand-dark="#06ad56"
      brand-color-night="#0a9b52"
      brand-dark-night="#067a3f"
      @update:description="setDescription"
      @input="onInput"
      @delete="onDelete"
      @pay="pay"
      @close="closePage"
    />
  </div>
</template>

<style scoped lang="less">
.code-pay-page {
  min-height: 100%;
  min-height: 100dvh;
  background: var(--h5-bg-page);
  box-sizing: border-box;

  &__brand {
    height: 120px;

    &--wechat {
      background: linear-gradient(135deg, #07c160 0%, #06ad56 100%);
    }
  }

  &__card {
    margin: -48px 16px 0;
    padding: 40px 20px;
    background: var(--h5-bg-card);
    border-radius: 12px;
    box-shadow: var(--h5-shadow-card);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  &__tip {
    margin: 0;
    font-size: 14px;
    color: var(--h5-text-secondary);
  }

  &__error-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgb(250 140 22 / 10%);
    margin-bottom: 4px;
  }

  &__error-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--h5-text-primary);
  }

  &__error {
    margin: 0;
    font-size: 13px;
    color: var(--h5-text-secondary);
    line-height: 1.6;
  }
}

html.dark .code-pay-page__brand--wechat {
  background: linear-gradient(135deg, #0a9b52 0%, #067a3f 100%);
}
</style>
