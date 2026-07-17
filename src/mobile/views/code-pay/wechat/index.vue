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
  authRedirecting,
  init,
  onInput,
  onDelete,
  pay,
} = useCodePayPage({ code, clientEnv: 'wechat' })

onMounted(() => {
  init()
})
</script>

<template>
  <div class="code-pay-wechat">
    <div v-if="loading || authRedirecting" class="code-pay-wechat__state">
      <van-loading color="#07c160" size="28px" />
      <p>{{ authRedirecting ? t('codePay.authorizing') : t('codePay.loading') }}</p>
    </div>
    <div v-else-if="loadError" class="code-pay-wechat__state code-pay-wechat__error">
      <p>{{ loadError }}</p>
    </div>
    <CodePayShell
      v-else
      :merchant-name="info.name"
      :display-amount="displayAmount"
      :amount-type="info.amountType"
      :description="description"
      :paying="paying"
      :paid="paid"
      brand-color="#07c160"
      brand-dark="#06ad56"
      @update:description="setDescription"
      @input="onInput"
      @delete="onDelete"
      @pay="pay"
    />
  </div>
</template>

<style scoped lang="less">
.code-pay-wechat {
  min-height: 100vh;
  background: #f5f5f5;

  &__state {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #666;
    font-size: 14px;
    padding: 24px;
    text-align: center;
  }

  &__error {
    color: #ee0a24;
  }
}
</style>
