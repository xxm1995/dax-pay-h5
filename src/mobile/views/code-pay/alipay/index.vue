<script lang="ts" setup>
/**
 * 码牌支付-支付宝端
 */
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import InitLoadingMask from '@/shared/components/pay/InitLoadingMask.vue'
import CodePayShell from '../shared/CodePayShell.vue'
import { useCodePayPage } from '../shared/useCodePayPage'

defineOptions({ name: 'CodePayAlipay' })

// 支付宝品牌色
const BRAND_COLOR = '#1677ff'

const { t } = useI18n()
const route = useRoute()
const code = route.params.code as string

const {
  ready,
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
} = useCodePayPage({ code, clientEnv: 'alipay' })

/**
 * InitLoadingMask 阶段文案
 */
const maskTipKey = computed(() => {
  if (authRedirecting.value) {
    return 'codePay.authorizing'
  }
  if (paying.value) {
    return 'codePay.paying'
  }
  return 'codePay.loading'
})

onMounted(() => {
  init()
})
</script>

<template>
  <div class="code-pay-page">
    <!-- 初始化/授权/支付中：统一全屏遮罩 -->
    <InitLoadingMask
      v-if="!ready || authRedirecting || paying"
      :brand-color="BRAND_COLOR"
      :tip-key="maskTipKey"
    />

    <!-- 加载失败 -->
    <template v-else-if="loadError">
      <div class="code-pay-page__brand code-pay-page__brand--alipay" />
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
      brand-color="#1677ff"
      brand-dark="#0958d9"
      brand-color-night="#1256d4"
      brand-dark-night="#0a47b0"
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

    &--alipay {
      background: linear-gradient(135deg, #1677ff 0%, #0958d9 100%);
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

html.dark .code-pay-page__brand--alipay {
  background: linear-gradient(135deg, #1256d4 0%, #0a47b0 100%);
}
</style>
