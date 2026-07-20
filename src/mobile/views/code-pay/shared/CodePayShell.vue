<script lang="ts" setup>
/**
 * 码牌收款共用 UI
 *
 * 视觉对齐聚合各环境页（上浮卡 + 灰阶 token）与收银结果态；
 * 通道品牌色由端页注入（微信绿 / 支付宝蓝）；深色模式优先用 night 色压亮。
 */
import { computed, ref, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDesignSetting } from '@/shared/hooks/setting/useDesignSetting'
import CodePayResultCard from './CodePayResultCard.vue'

defineOptions({ name: 'CodePayShell' })

const props = withDefaults(defineProps<{
  /** 商户/码牌名称 */
  merchantName?: string
  /** 商户简称(副标题「向{name}付款」) */
  mchShortName?: string
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
  /** 支付成功后的订单号(可选展示) */
  orderNo?: string
  /** 品牌色（浅色） */
  brandColor?: string
  /** 品牌加深色（浅色） */
  brandDark?: string
  /** 品牌色（深色模式，压亮） */
  brandColorNight?: string
  /** 品牌加深色（深色模式） */
  brandDarkNight?: string
}>(), {
  merchantName: '',
  mchShortName: '',
  amountType: 'random',
  description: '',
  paying: false,
  paid: false,
  orderNo: '',
  brandColor: '#5d9dfe',
  brandDark: '#4a87e0',
  brandColorNight: '',
  brandDarkNight: '',
})

const emit = defineEmits<{
  /** 金额键盘输入（Vant 数字键可能为 number） */
  'input': [key: string | number]
  /** 金额删除 */
  'delete': []
  /** 确认支付 */
  'pay': []
  /** 更新备注 */
  'update:description': [value: string]
  /** 完成/关闭页面 */
  'close': []
}>()

const { t } = useI18n()
const { getDarkMode } = useDesignSetting()
const showRemark = ref(false)
const remarkDraft = ref('')

/** 是否固定金额布局 */
const isFixed = computed(() => props.amountType === 'fixed')

/** 近黑色品牌（抖音）：深色下主按钮需浅底深字 */
function isNearBlackBrand(hex?: string) {
  if (!hex) {
    return false
  }
  const h = hex.replace('#', '')
  if (h.length !== 6) {
    return false
  }
  const r = Number.parseInt(h.slice(0, 2), 16)
  const g = Number.parseInt(h.slice(2, 4), 16)
  const b = Number.parseInt(h.slice(4, 6), 16)
  return (r + g + b) / 3 < 60
}

/** 当前生效品牌色（深色优先 night，用于顶栏） */
const effectiveBrand = computed(() => {
  if (unref(getDarkMode) === 'dark' && props.brandColorNight) {
    return props.brandColorNight
  }
  return props.brandColor
})

/** 当前生效品牌加深色（顶栏渐变） */
const effectiveBrandDark = computed(() => {
  if (unref(getDarkMode) === 'dark' && props.brandDarkNight) {
    return props.brandDarkNight
  }
  return props.brandDark
})

/** 操作按钮色：深色 + 近黑品牌时反色为浅底 */
const effectiveAction = computed(() => {
  if (unref(getDarkMode) === 'dark' && isNearBlackBrand(props.brandColor)) {
    return '#f2f2f2'
  }
  return effectiveBrand.value
})

/** 操作按钮文字色 */
const effectiveActionText = computed(() => {
  if (unref(getDarkMode) === 'dark' && isNearBlackBrand(props.brandColor)) {
    return '#161823'
  }
  return '#ffffff'
})

/** 副标题：向{商户简称}付款 */
const payToText = computed(() => {
  const name = props.mchShortName || t('codePay.merchantDefault')
  // 向{name}付款
  return t('codePay.payToMerchant', { name })
})

/**
 * 打开备注弹窗
 */
function openRemark() {
  if (props.paid || props.paying) {
    return
  }
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

/**
 * 键盘确认 / 固定金额支付
 */
function onPay() {
  if (props.paying || props.paid) {
    return
  }
  emit('pay')
}
</script>

<template>
  <div
    class="code-pay-shell"
    :class="{
      'code-pay-shell--fixed': isFixed,
      'code-pay-shell--paid': paid,
    }"
    :style="{
      '--brand': effectiveBrand,
      '--brand-dark': effectiveBrandDark,
      '--brand-action': effectiveAction,
      '--brand-action-text': effectiveActionText,
    }"
  >
    <!-- 品牌顶栏（paid 和非 paid 都渲染，作为结果卡/收款卡负 margin 叠放对象） -->
    <div class="code-pay-shell__brand" />

    <!-- 支付成功结果态：独立组件，对齐聚合上浮卡片风格 -->
    <CodePayResultCard
      v-if="paid"
      :amount="displayAmount"
      :merchant-name="merchantName"
      :order-no="orderNo"
      :brand-color="brandColor"
      :brand-color-dark="brandColorNight || brandColor"
      @close="emit('close')"
    />

    <template v-else>
      <div class="code-pay-shell__card enter-y">
        <div class="code-pay-shell__merchant">
          <div class="code-pay-shell__avatar">
            <svg viewBox="0 0 1024 1024" width="22" height="22" aria-hidden="true">
              <path fill="#fff" d="M832 320 704 320c0-106.048-85.952-192-192-192s-192 85.952-192 192L192 320c-35.36 0-64 28.64-64 64l0 384c0 70.688 57.312 128 128 128l512 0c70.688 0 128-57.312 128-128l0-384C896 348.64 867.36 320 832 320zM512 192c70.688 0 128 57.312 128 128L384 320C384 249.312 441.312 192 512 192zM832 768c0 35.36-28.64 64-64 64L256 832c-35.36 0-64-28.64-64-64l0-384 128 0 0 64c0 17.664 14.336 32 32 32s32-14.336 32-32l0-64 256 0 0 64c0 17.664 14.336 32 32 32s32-14.336 32-32l0-64 128 0L832 768z" />
            </svg>
          </div>
          <div class="code-pay-shell__merchant-text">
            <div class="code-pay-shell__merchant-name">
              {{ merchantName || t('codePay.merchantDefault') }}
            </div>
            <!-- 向{商户简称}付款 -->
            <div class="code-pay-shell__merchant-sub">
              {{ payToText }}
            </div>
          </div>
        </div>

        <!-- 付款金额标签：随机金额显示 -->
        <div v-if="!isFixed" class="code-pay-shell__amount-label">
          {{ t('codePay.amountLabel') }}
        </div>
        <div class="code-pay-shell__amount" :class="{ 'code-pay-shell__amount--fixed': isFixed }">
          <span class="code-pay-shell__currency">¥</span>
          <span
            class="code-pay-shell__amount-value"
            :class="{ 'code-pay-shell__amount-value--zero': displayAmount === '0' || displayAmount === '0.00' }"
          >
            {{ displayAmount }}
          </span>
        </div>
      </div>

      <!-- 备注 -->
      <div class="code-pay-shell__remark enter-y" @click="openRemark">
        <span class="code-pay-shell__remark-label">{{ t('codePay.remark') }}</span>
        <div class="code-pay-shell__remark-value">
          <span v-if="!description" class="code-pay-shell__remark-placeholder">{{ t('codePay.addRemark') }}</span>
          <span v-else>{{ description }}</span>
        </div>
        <svg class="code-pay-shell__remark-arrow" viewBox="0 0 1024 1024" width="16" height="16" aria-hidden="true">
          <path fill="#c0c4cc" d="M340.864 256 600.32 512 340.864 768c-13.312 12.864-12.64 34.624 0.448 48.448 13.056 13.408 34.144 14.016 47.424 0.448l283.52-274.976c6.4-6.24 9.984-14.592 9.984-23.488 0-8.896-3.584-17.248-9.984-23.488L388.736 220.096c-13.28-13.536-34.368-12.96-47.424 0.448C328.224 234.336 327.552 256.064 340.864 268.928z" />
        </svg>
      </div>

      <van-dialog
        v-model:show="showRemark"
        :title="t('codePay.addRemark')"
        show-cancel-button
        :confirm-button-text="t('common.save')"
        :cancel-button-text="t('common.cancel')"
        :confirm-button-color="effectiveAction"
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

      <!-- 随机金额：数字键盘（支付中隐藏） -->
      <van-number-keyboard
        v-if="!isFixed"
        theme="custom"
        extra-key="."
        :close-button-text="paying ? t('codePay.paying') : t('codePay.confirmPay')"
        :show="!paying"
        :z-index="100"
        @close="onPay"
        @input="(k: string | number) => emit('input', k)"
        @delete="emit('delete')"
      />

      <!-- 固定金额：底栏支付按钮 -->
      <div v-else class="code-pay-shell__fixed-pay">
        <van-button
          round
          block
          type="primary"
          :color="effectiveAction"
          :loading="paying"
          :disabled="paying"
          :loading-text="t('codePay.paying')"
          @click="onPay"
        >
          {{ `${t('codePay.confirmPay')} ¥${displayAmount}` }}
        </van-button>
      </div>
    </template>

    <!-- 支付中遮罩（随机金额键盘场景；固定金额用按钮 loading） -->
    <div v-if="paying && !isFixed" class="code-pay-shell__mask">
      <van-loading :color="effectiveBrand" size="28px" />
      <!-- 处理中 -->
      <p>{{ t('codePay.processing') }}</p>
    </div>
  </div>
</template>

<style scoped lang="less">
:deep(.van-key--blue) {
  background: var(--brand-action, var(--brand, #5d9dfe));
  color: var(--brand-action-text, #fff);
}

.code-pay-shell {
  min-height: 100%;
  background: var(--h5-bg-page);
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
  // 随机金额预留键盘高度 + 安全区
  padding-bottom: calc(280px + env(safe-area-inset-bottom, 0px));

  &--fixed {
    padding-bottom: calc(88px + env(safe-area-inset-bottom, 0px));
  }

  &--paid {
    padding-bottom: 0;
  }

  &__brand {
    height: 120px;
    flex-shrink: 0;
    background: linear-gradient(135deg, var(--brand, #5d9dfe) 0%, var(--brand-dark, #4a87e0) 100%);
  }

  &__card {
    position: relative;
    z-index: 1;
    margin: -48px 16px 0;
    padding: 24px 20px;
    background: var(--h5-bg-card);
    border-radius: 12px;
    box-shadow: var(--h5-shadow-card);
  }

  &__merchant {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  &--fixed &__merchant {
    margin-bottom: 16px;
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--brand, #5d9dfe) 0%, var(--brand-dark, #4a87e0) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgb(0 0 0 / 12%);
  }

  &__merchant-text {
    min-width: 0;
    text-align: left;
  }

  &__merchant-name {
    font-size: 17px;
    font-weight: 600;
    color: var(--h5-text-primary);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 220px;
  }

  &__merchant-sub {
    margin-top: 2px;
    font-size: 12px;
    color: var(--h5-text-secondary);
  }

  &__amount-label {
    font-size: 14px;
    color: var(--h5-text-primary);
    margin-bottom: 10px;
  }

  &__amount {
    display: flex;
    align-items: baseline;
    border-bottom: 1px solid var(--h5-border);
    padding-bottom: 10px;

    &--fixed {
      justify-content: center;
      border-bottom: none;
      padding-bottom: 0;
      padding-top: 8px;
    }
  }

  &__currency {
    font-size: 28px;
    font-weight: 500;
    margin-right: 6px;
    color: var(--h5-text-primary);
  }

  &__amount--fixed &__currency {
    font-size: 32px;
  }

  &__amount-value {
    font-size: 40px;
    font-weight: 600;
    color: var(--h5-text-primary);
    flex: 1;
    line-height: 1.2;
    transition: color 0.2s ease;
    word-break: break-all;

    &--zero {
      color: var(--h5-text-placeholder);
    }
  }

  &__amount--fixed &__amount-value {
    flex: none;
    font-size: 48px;
  }

  &__remark {
    background: var(--h5-bg-card);
    border-radius: 12px;
    padding: 16px;
    margin: 12px 16px 0;
    display: flex;
    align-items: center;
    box-shadow: var(--h5-shadow-card);
  }

  &__remark-label {
    font-size: 15px;
    color: var(--h5-text-primary);
    width: 48px;
    flex-shrink: 0;
  }

  &__remark-value {
    flex: 1;
    font-size: 15px;
    margin: 0 12px;
    text-align: right;
    color: var(--h5-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-break: break-all;
  }

  &__remark-placeholder {
    color: var(--h5-text-placeholder);
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
    z-index: 20;
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
    background: var(--h5-bg-card);
    box-shadow: 0 -2px 12px rgb(0 0 0 / 5%);
  }

  // 支付中遮罩
  &__mask {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: color-mix(in srgb, var(--h5-bg-page) 80%, transparent);
    color: var(--h5-text-secondary);
    font-size: 14px;

    p {
      margin: 0;
    }
  }
}
</style>
