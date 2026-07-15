<script lang="ts" setup>
import type { CodePayInfo, CodePayResult } from '@/shared/api/code-pay'
import { showNotify, showSuccessToast } from 'vant'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useRoute } from 'vue-router'
import { codePay, getCodePayInfo } from '@/shared/api/code-pay'

defineOptions({ name: 'CodePayPage' })

const { t } = useI18n()
const route = useRoute()
const { code } = route.params

// 码牌信息(从后端加载)
const loading = ref(true)
const paying = ref(false)
const loadError = ref('')
const info = ref<CodePayInfo>({})
const payResult = ref<CodePayResult | null>(null)

// 自定义金额输入(random 模式)
const amount = ref('0')
const description = ref('')
const showRemark = ref(false)

// 展示金额: 固定金额取码牌配置, 自定义金额取用户输入
const displayAmount = computed(() => {
  if (info.value.amountType === 'fixed' && info.value.fixedAmount) {
    return (info.value.fixedAmount / 100).toFixed(2)
  }
  return amount.value
})

const paid = computed(() => payResult.value?.status === 'success')

onMounted(loadInfo)

/**
 * 根据 UA 识别客户端环境(与后端 ClientEnvEnum 对齐)
 */
function detectClientEnv(): string {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('micromessenger')) {
    return 'wechat_pay'
  }
  if (ua.includes('alipayclient') || ua.includes('alipay')) {
    return 'alipay'
  }
  if (ua.includes('unionpay') || ua.includes('cloudpay') || ua.includes('upwallet')) {
    return 'union_pay'
  }
  if (ua.includes('aweme') || ua.includes('toutiao') || ua.includes('douyin')) {
    return 'douyin'
  }
  // 浏览器扫码预览: 后端会拒绝 browser, 默认按微信便于开发调试
  return 'wechat_pay'
}

/**
 * 加载码牌信息
 */
async function loadInfo() {
  try {
    info.value = await getCodePayInfo(code as string)
  }
  catch (e: any) {
    loadError.value = e?.message || t('codePay.loadFail')
  }
  finally {
    loading.value = false
  }
}

// 金额输入(van-number-keyboard)
function onInput(key: string) {
  // 忽略第二个小数点
  if (key === '.' && amount.value.includes('.')) {
    return
  }
  if (amount.value === '0' && key !== '.') {
    amount.value = key
  }
  else {
    amount.value += key
  }
}

function onDelete() {
  amount.value = amount.value.slice(0, -1) || '0'
}

/**
 * 元 → 分
 */
function yuanToFen(yuan: string): number {
  const n = Number(yuan)
  if (!Number.isFinite(n) || n <= 0) {
    return 0
  }
  return Math.round(n * 100)
}

/**
 * 确认支付: 调后端码牌支付, 按 payBody 跳转/展示
 */
async function pay() {
  if (paying.value || paid.value) {
    return
  }
  // 固定金额模式直接用码牌金额, 自定义模式校验输入
  let amountFen: number | undefined
  if (info.value.amountType === 'random') {
    amountFen = yuanToFen(amount.value)
    if (!amountFen) {
      showNotify({ type: 'warning', message: t('codePay.amountZero') })
      return
    }
  }
  paying.value = true
  try {
    payResult.value = await codePay({
      code: code as string,
      amount: amountFen,
      description: description.value || undefined,
      clientEnv: detectClientEnv(),
      // 一期 H5; 小程序传 mini
      runtime: 'h5',
      device: 'mobile',
    })
    if (payResult.value?.status === 'success') {
      showSuccessToast(t('codePay.paySuccess'))
      return
    }
    // 链接类直接跳转
    if (payResult.value?.payBody && payResult.value.payBodyType === 'url') {
      window.location.href = payResult.value.payBody
      return
    }
    // 其它 payBody(jsapi 等)一期提示已下单, OAuth/调起后续完善
    if (payResult.value?.payBody) {
      showSuccessToast(t('codePay.payLaunched'))
      return
    }
    showNotify({ type: 'warning', message: t('codePay.payPending') })
  }
  catch (e: any) {
    showNotify({ type: 'danger', message: e?.message || t('codePay.payFail') })
  }
  finally {
    paying.value = false
  }
}
</script>

<template>
  <div class="code-pay">
    <!-- 顶部品牌色块 -->
    <div class="code-pay__brand" />

    <!-- 加载中 -->
    <div v-if="loading" class="code-pay__card enter-y code-pay__loading">
      <van-loading color="#5d9dfe" size="24px" />
    </div>

    <!-- 加载失败 -->
    <div v-else-if="loadError" class="code-pay__card enter-y">
      <div class="code-pay__error">
        <svg viewBox="0 0 1024 1024" width="40" height="40" aria-hidden="true">
          <path fill="#ee0a24" d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 561.7-41.8 41.8L512 515.8 360.3 667.5l-41.8-41.8L470.2 474 318.5 322.3l41.8-41.8L512 432.2l151.7-151.7 41.8 41.8L553.8 474l151.7 151.7z" />
        </svg>
        <p>{{ loadError }}</p>
      </div>
    </div>

    <!-- 正常展示 -->
    <template v-else>
      <!-- 商户 + 金额卡片 -->
      <div class="code-pay__card enter-y">
        <div class="code-pay__merchant">
          <!-- 商户品牌头像: 主色调圆图标 + 店铺 SVG -->
          <div class="code-pay__avatar">
            <svg viewBox="0 0 1024 1024" width="24" height="24" aria-hidden="true">
              <path fill="#fff" d="M832 320 704 320c0-106.048-85.952-192-192-192s-192 85.952-192 192L192 320c-35.36 0-64 28.64-64 64l0 384c0 70.688 57.312 128 128 128l512 0c70.688 0 128-57.312 128-128l0-384C896 348.64 867.36 320 832 320zM512 192c70.688 0 128 57.312 128 128L384 320C384 249.312 441.312 192 512 192zM832 768c0 35.36-28.64 64-64 64L256 832c-35.36 0-64-28.64-64-64l0-384 128 0 0 64c0 17.664 14.336 32 32 32s32-14.336 32-32l0-64 256 0 0 64c0 17.664 14.336 32 32 32s32-14.336 32-32l0-64 128 0L832 768z" />
            </svg>
          </div>
          {{ info.name || t('codePay.merchantDefault') }}
        </div>
        <div class="code-pay__amount-label">
          {{ t('codePay.amountLabel') }}
        </div>
        <div class="code-pay__amount">
          <span class="code-pay__currency">¥</span>
          <span class="code-pay__amount-value" :class="{ 'code-pay__amount-value--zero': displayAmount === '0' }">
            {{ displayAmount }}
          </span>
        </div>
      </div>

      <!-- 备注单元格 -->
      <div class="code-pay__remark enter-y" @click="showRemark = true">
        <span class="code-pay__remark-label">{{ t('codePay.remark') }}</span>
        <div class="code-pay__remark-value">
          <span v-if="!description" class="code-pay__remark-placeholder">{{ t('codePay.addRemark') }}</span>
          <span v-else>{{ description }}</span>
        </div>
        <!-- 箭头图标用 SVG 替代文字 › -->
        <svg class="code-pay__remark-arrow" viewBox="0 0 1024 1024" width="16" height="16" aria-hidden="true">
          <path fill="#ccc" d="M340.864 256 600.32 512 340.864 768c-13.312 12.864-12.64 34.624 0.448 48.448 13.056 13.408 34.144 14.016 47.424 0.448l283.52-274.976c6.4-6.24 9.984-14.592 9.984-23.488 0-8.896-3.584-17.248-9.984-23.488L388.736 220.096c-13.28-13.536-34.368-12.96-47.424 0.448C328.224 234.336 327.552 256.064 340.864 268.928z" />
        </svg>
      </div>

      <!-- 备注弹窗 -->
      <van-dialog
        v-model:show="showRemark"
        :title="t('codePay.addRemark')"
        show-cancel-button
        :confirm-button-text="t('common.save')"
        :cancel-button-text="t('common.cancel')"
        confirm-button-color="#5d9dfe"
        cancel-button-color="#999"
      >
        <van-field
          v-model="description"
          rows="3"
          autosize
          type="textarea"
          :maxlength="50"
          :placeholder="t('codePay.remarkPlaceholder')"
          show-word-limit
          class="code-pay__remark-field"
        />
      </van-dialog>

      <!-- 自定义金额: 数字键盘(固定金额不显示键盘, 直接点确认支付) -->
      <van-number-keyboard
        v-if="info.amountType === 'random'"
        theme="custom"
        extra-key="."
        :close-button-text="t('codePay.confirmPay')"
        :show="true"
        @close="pay"
        @input="onInput"
        @delete="onDelete"
      />
      <!-- 固定金额: 底部确认支付按钮 -->
      <div v-else class="code-pay__fixed-pay">
        <button class="code-pay__fixed-pay-btn" :disabled="paying || paid" @click="pay">
          {{ paid ? t('codePay.paySuccess') : `${t('codePay.confirmPay')} ¥${displayAmount}` }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="less">
// 局部主色统一为全局主题色 #5d9dfe，派生加深色用于渐变收尾
@brand: #5d9dfe;
@brand-dark: #4a87e0;
@bg: #f5f5f5;
@text-main: #333;
@text-sub: #999;

:deep(.van-key--blue) {
  background: @brand;
  color: #fff;
}

.code-pay {
  min-height: 100vh;
  background: @bg;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: 280px;

  &__brand {
    height: 160px;
    // 顶部品牌色块改为渐变，与卡片平滑过渡
    background: linear-gradient(135deg, @brand 0%, @brand-dark 100%);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    // 底部圆角，避免纯色矩形呆板
    border-radius: 0 0 24px 24px;
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
  }

  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px 0;
    color: @text-sub;
    font-size: 14px;
    text-align: center;

    p {
      margin: 0;
    }
  }

  &__card {
    position: relative;
    z-index: 1;
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    margin: 40px 16px 0;
    // 卡片阴影加深为主色调柔光，增强浮起感
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

  // 商户品牌头像: 主色调圆形容器
  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, @brand 0%, @brand-dark 100%);
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
    // 金额变化时加平滑过渡
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

  // 箭头改为 SVG 元素，去掉文字样式
  &__remark-arrow {
    color: #ccc;
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
    background: @brand;
    color: #fff;
    border: none;
    border-radius: 100px;
    font-size: 18px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(93, 157, 254, 0.3);

    &:active {
      background: @brand-dark;
      opacity: 0.95;
    }
  }
}
</style>
