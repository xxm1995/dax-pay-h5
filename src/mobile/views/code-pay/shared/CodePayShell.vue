<script lang="ts" setup>
/**
 * 码牌收款共用 UI: 商户名 / 金额 / 备注 / 键盘或固定支付按钮
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'CodePayShell' })

const props = withDefaults(defineProps<{
  /** 商户/码牌名称 */
  merchantName?: string
  /** 展示金额(元字符串) */
  displayAmount: string
  /** 金额类型 */
  amountType?: 'random' | 'fixed' | string
  /** 备注 */
  description?: string
  /** 支付中 */
  paying?: boolean
  /** 已支付成功 */
  paid?: boolean
  /** 品牌色 */
  brandColor?: string
  /** 品牌加深色 */
  brandDark?: string
}>(), {
  merchantName: '',
  amountType: 'random',
  description: '',
  paying: false,
  paid: false,
  brandColor: '#5d9dfe',
  brandDark: '#4a87e0',
})

const emit = defineEmits<{
  /** 金额键盘输入 */
  'input': [key: string]
  /** 金额删除 */
  'delete': []
  /** 确认支付 */
  'pay': []
  /** 更新备注 */
  'update:description': [value: string]
}>()

const { t } = useI18n()
const showRemark = ref(false)
const remarkDraft = ref('')

/**
 * 打开备注弹窗
 */
function openRemark() {
  remarkDraft.value = props.description || ''
  showRemark.value = true
}

/**
 * 保存备注
 */
function saveRemark() {
  emit('update:description', remarkDraft.value)
  showRemark.value = false
}
</script>

<template>
  <div class="code-pay-shell" :style="{ '--brand': brandColor, '--brand-dark': brandDark }">
    <div class="code-pay-shell__brand" />

    <div class="code-pay-shell__card enter-y">
      <div class="code-pay-shell__merchant">
        <div class="code-pay-shell__avatar">
          <svg viewBox="0 0 1024 1024" width="24" height="24" aria-hidden="true">
            <path fill="#fff" d="M832 320 704 320c0-106.048-85.952-192-192-192s-192 85.952-192 192L192 320c-35.36 0-64 28.64-64 64l0 384c0 70.688 57.312 128 128 128l512 0c70.688 0 128-57.312 128-128l0-384C896 348.64 867.36 320 832 320zM512 192c70.688 0 128 57.312 128 128L384 320C384 249.312 441.312 192 512 192zM832 768c0 35.36-28.64 64-64 64L256 832c-35.36 0-64-28.64-64-64l0-384 128 0 0 64c0 17.664 14.336 32 32 32s32-14.336 32-32l0-64 256 0 0 64c0 17.664 14.336 32 32 32s32-14.336 32-32l0-64 128 0L832 768z" />
          </svg>
        </div>
        {{ merchantName || t('codePay.merchantDefault') }}
      </div>
      <div class="code-pay-shell__amount-label">
        {{ t('codePay.amountLabel') }}
      </div>
      <div class="code-pay-shell__amount">
        <span class="code-pay-shell__currency">¥</span>
        <span
          class="code-pay-shell__amount-value"
          :class="{ 'code-pay-shell__amount-value--zero': displayAmount === '0' || displayAmount === '0.00' }"
        >
          {{ displayAmount }}
        </span>
      </div>
    </div>

    <div class="code-pay-shell__remark enter-y" @click="openRemark">
      <span class="code-pay-shell__remark-label">{{ t('codePay.remark') }}</span>
      <div class="code-pay-shell__remark-value">
        <span v-if="!description" class="code-pay-shell__remark-placeholder">{{ t('codePay.addRemark') }}</span>
        <span v-else>{{ description }}</span>
      </div>
      <svg class="code-pay-shell__remark-arrow" viewBox="0 0 1024 1024" width="16" height="16" aria-hidden="true">
        <path fill="#ccc" d="M340.864 256 600.32 512 340.864 768c-13.312 12.864-12.64 34.624 0.448 48.448 13.056 13.408 34.144 14.016 47.424 0.448l283.52-274.976c6.4-6.24 9.984-14.592 9.984-23.488 0-8.896-3.584-17.248-9.984-23.488L388.736 220.096c-13.28-13.536-34.368-12.96-47.424 0.448C328.224 234.336 327.552 256.064 340.864 268.928z" />
      </svg>
    </div>

    <van-dialog
      v-model:show="showRemark"
      :title="t('codePay.addRemark')"
      show-cancel-button
      :confirm-button-text="t('common.save')"
      :cancel-button-text="t('common.cancel')"
      :confirm-button-color="brandColor"
      cancel-button-color="#999"
      @confirm="saveRemark"
    >
      <van-field
        v-model="remarkDraft"
        rows="3"
        autosize
        type="textarea"
        :maxlength="50"
        :placeholder="t('codePay.remarkPlaceholder')"
        show-word-limit
        class="code-pay-shell__remark-field"
      />
    </van-dialog>

    <van-number-keyboard
      v-if="amountType === 'random'"
      theme="custom"
      extra-key="."
      :close-button-text="t('codePay.confirmPay')"
      :show="true"
      @close="emit('pay')"
      @input="(k: string) => emit('input', k)"
      @delete="emit('delete')"
    />
    <div v-else class="code-pay-shell__fixed-pay">
      <button
        class="code-pay-shell__fixed-pay-btn"
        :disabled="paying || paid"
        @click="emit('pay')"
      >
        {{ paid ? t('codePay.paySuccess') : `${t('codePay.confirmPay')} ¥${displayAmount}` }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="less">
@bg: #f5f5f5;
@text-main: #333;
@text-sub: #999;

:deep(.van-key--blue) {
  background: var(--brand, #5d9dfe);
  color: #fff;
}

.code-pay-shell {
  min-height: 100vh;
  background: @bg;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: 280px;

  &__brand {
    height: 160px;
    background: linear-gradient(135deg, var(--brand, #5d9dfe) 0%, var(--brand-dark, #4a87e0) 100%);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    border-radius: 0 0 24px 24px;
  }

  &__card {
    position: relative;
    z-index: 1;
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    margin: 40px 16px 0;
    box-shadow: 0 8px 24px rgba(93, 157, 254, 0.12);
  }

  &__merchant {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 24px;
    font-size: 18px;
    font-weight: 600;
    color: @text-main;
  }

  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--brand, #5d9dfe) 0%, var(--brand-dark, #4a87e0) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(93, 157, 254, 0.3);
  }

  &__amount-label {
    font-size: 14px;
    color: @text-main;
    margin-bottom: 12px;
  }

  &__amount {
    display: flex;
    align-items: baseline;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
  }

  &__currency {
    font-size: 28px;
    font-weight: 500;
    margin-right: 8px;
    color: @text-main;
  }

  &__amount-value {
    font-size: 40px;
    font-weight: 600;
    color: @text-main;
    flex: 1;
    line-height: 1.2;
    transition: color 0.2s ease;

    &--zero {
      color: #ccc;
    }
  }

  &__remark {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    margin: 16px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 8px rgb(0 0 0 / 2%);
  }

  &__remark-label {
    font-size: 15px;
    color: @text-main;
    width: 60px;
  }

  &__remark-value {
    flex: 1;
    font-size: 15px;
    margin: 0 12px;
    text-align: right;
  }

  &__remark-placeholder {
    color: #ccc;
  }

  &__remark-arrow {
    flex-shrink: 0;
  }

  &__remark-field {
    padding: 16px;
  }

  &__fixed-pay {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px;
    background: #fff;
    box-shadow: 0 -2px 10px rgb(0 0 0 / 5%);
  }

  &__fixed-pay-btn {
    width: 100%;
    height: 48px;
    background: var(--brand, #5d9dfe);
    color: #fff;
    border: none;
    border-radius: 100px;
    font-size: 18px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(93, 157, 254, 0.3);

    &:active {
      background: var(--brand-dark, #4a87e0);
      opacity: 0.95;
    }

    &:disabled {
      opacity: 0.6;
    }
  }
}
</style>
