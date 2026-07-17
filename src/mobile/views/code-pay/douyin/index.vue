<script lang="ts" setup>
/**
 * 码牌支付-抖音端（黑白主视觉）
 */
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import CodePayShell from '../shared/CodePayShell.vue'
import { useCodePayPage } from '../shared/useCodePayPage'

defineOptions({ name: 'CodePayDouyin' })

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
} = useCodePayPage({ code, clientEnv: 'douyin' })

onMounted(() => {
  init()
})
</script>

<template>
  <div class="code-pay-page">
    <!-- 加载 / 授权中：品牌顶栏 + 上浮卡 -->
    <template v-if="loading || authRedirecting">
      <div class="code-pay-page__brand code-pay-page__brand--douyin" />
      <div class="code-pay-page__card">
        <van-loading color="#161823" size="28px" />
        <!-- 正在授权 / 加载中 -->
        <p class="code-pay-page__tip">
          {{ authRedirecting ? t('codePay.authorizing') : t('codePay.loading') }}
        </p>
      </div>
    </template>

    <!-- 加载失败 -->
    <template v-else-if="loadError">
      <div class="code-pay-page__brand code-pay-page__brand--douyin" />
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
      brand-color="#161823"
      brand-dark="#000000"
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
  background: #f5f7fa;
  box-sizing: border-box;

  &__brand {
    height: 120px;

    // 抖音黑白主视觉（近黑 → 纯黑）
    &--douyin {
      background: linear-gradient(135deg, #161823 0%, #000 100%);
    }
  }

  &__card {
    margin: -48px 16px 0;
    padding: 40px 20px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgb(0 0 0 / 6%);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  &__tip {
    margin: 0;
    font-size: 14px;
    color: #909399;
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
    color: #303133;
  }

  &__error {
    margin: 0;
    font-size: 13px;
    color: #909399;
    line-height: 1.6;
  }
}
</style>
