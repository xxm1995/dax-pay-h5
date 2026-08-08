<script lang="ts" setup>
import type { TransferConfirmInfo } from '@/shared/api/transfer-confirm'
import { showNotify, showToast } from 'vant'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useRoute } from 'vue-router'
import { getTransferConfirmInfo } from '@/shared/api/transfer-confirm'
import { detectClientEnv } from '@/shared/utils/client-env'

defineOptions({ name: 'TransferConfirm' })

const { t } = useI18n()
const route = useRoute()

const loading = ref(true)
const processing = ref(false)
// 加载是否失败(失败时不渲染收款按钮, 避免带空参数拉起)
const loadFailed = ref(false)
const info = ref<TransferConfirmInfo>({})

// 是否在微信内浏览器
const isWechat = computed(() => detectClientEnv() === 'wechat')

// 金额(分→元)
const amountYuan = computed(() => {
  const fen = info.value.amount ?? 0
  return (fen / 100).toFixed(2)
})

// 是否已终态不可操作
const isTerminal = computed(() => info.value.received === true)

// 用户已确认收款(前端状态, 切换到成功视图)
const confirmed = ref(false)

// 是否展示成功图标(已完成/已确认)
const showSuccessIcon = computed(() => isTerminal.value || confirmed.value)

// 顶部状态标题
const statusTitle = computed(() => {
  if (isTerminal.value) {
    return t('transferConfirm.completed')
  }
  if (confirmed.value) {
    return t('transferConfirm.confirmedTitle')
  }
  return t('transferConfirm.pending')
})

// 顶部状态描述
const statusDesc = computed(() => {
  if (confirmed.value) {
    return t('transferConfirm.confirmedDesc')
  }
  if (!isTerminal.value) {
    return t('transferConfirm.pendingDesc')
  }
  return ''
})

const transferNo = route.params.transferNo as string

/** 加载确认收款信息 */
async function loadInfo() {
  try {
    loading.value = true
    loadFailed.value = false
    info.value = await getTransferConfirmInfo(transferNo)
  }
  catch {
    loadFailed.value = true
    // 国际化：获取转账信息失败
    showToast(t('transferConfirm.loadFailed'))
  }
  finally {
    loading.value = false
  }
}

/**
 * 调用微信 JSAPI 拉起商家转账确认收款
 * WeixinJSBridge.invoke('requestMerchantTransfer', {mchId, appId, package}, cb)
 */
function invokeMerchantTransfer() {
  return new Promise<void>((resolve, reject) => {
    const bridge = (window as any).WeixinJSBridge
    if (!bridge || typeof bridge.invoke !== 'function') {
      reject(new Error('bridge-not-found'))
      return
    }
    bridge.invoke(
      'requestMerchantTransfer',
      {
        mchId: info.value.mchId,
        appId: info.value.appId,
        package: info.value.packageInfo,
      },
      (res: { err_msg?: string }) => {
        if (res?.err_msg === 'requestMerchantTransfer:ok') {
          resolve()
        }
        else if (res?.err_msg === 'requestMerchantTransfer:cancel') {
          reject(new Error('cancel'))
        }
        else {
          reject(new Error(res?.err_msg || 'fail'))
        }
      },
    )
  })
}

/** 等待 WeixinJSBridge 就绪 */
function waitForBridge(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).WeixinJSBridge) {
      resolve()
      return
    }
    document.addEventListener(
      'WeixinJSBridgeReady',
      () => resolve(),
      { once: true },
    )
    // 超时兜底
    setTimeout(() => {
      if (!(window as any).WeixinJSBridge) {
        reject(new Error('bridge-timeout'))
      }
    }, 3000)
  })
}

/** 点击确认收款 */
async function handleConfirm() {
  if (processing.value || isTerminal.value) {
    return
  }

  // 非微信环境提示
  if (!isWechat.value) {
    // 国际化：请在微信中打开
    showToast(t('transferConfirm.openInWechat'))
    return
  }

  processing.value = true
  try {
    await waitForBridge()
    await invokeMerchantTransfer()
    // 确认成功: 切换到"已确认收款"视图, 由用户手动关闭
    confirmed.value = true
  }
  catch (err: any) {
    if (err?.message === 'cancel') {
      // 国际化：已取消收款
      showToast(t('transferConfirm.cancelled'))
    }
    else {
      // 国际化：收款失败
      showNotify({ type: 'danger', message: t('transferConfirm.failed') })
    }
  }
  finally {
    processing.value = false
  }
}

/** 确认成功后点击完成, 关闭当前窗口(微信内 webview) */
function handleDone() {
  const bridge = (window as any).WeixinJSBridge
  if (bridge?.call) {
    bridge.call('closeWindow')
  }
}

onMounted(() => {
  if (!transferNo) {
    showToast(t('transferConfirm.invalidTransferNo'))
    loading.value = false
    return
  }
  loadInfo()
})
</script>

<template>
  <div class="transfer-confirm">
    <!-- 加载中 -->
    <div v-if="loading" class="transfer-confirm__loading">
      <van-loading size="32px" color="#07c160">
        {{ t('transferConfirm.loading') }}
      </van-loading>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="loadFailed" class="transfer-confirm__error">
      {{ t('transferConfirm.loadFailed') }}
    </div>

    <!-- 内容 -->
    <template v-else>
      <!-- 顶部状态 -->
      <div class="transfer-confirm__status">
        <div class="transfer-confirm__icon">
          <!-- 已完成/已确认: 绿色勾 -->
          <svg v-if="showSuccessIcon" viewBox="0 0 48 48" width="48" height="48">
            <circle cx="24" cy="24" r="22" fill="#07c160" />
            <path d="M16 24l6 6 12-12" stroke="#fff" stroke-width="3" fill="none" />
          </svg>
          <!-- 待确认: 黄色感叹号 -->
          <svg v-else viewBox="0 0 48 48" width="48" height="48">
            <circle cx="24" cy="24" r="22" fill="#faad14" />
            <path d="M24 14v12M24 32v2" stroke="#fff" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>
        <h2 class="transfer-confirm__title">
          {{ statusTitle }}
        </h2>
        <p v-if="statusDesc" class="transfer-confirm__desc">
          {{ statusDesc }}
        </p>
      </div>

      <!-- 金额 -->
      <div class="transfer-confirm__amount">
        <span class="transfer-confirm__currency">¥</span>
        <span class="transfer-confirm__value">{{ amountYuan }}</span>
      </div>

      <!-- 转账信息 -->
      <div class="transfer-confirm__info">
        <div class="transfer-confirm__row">
          <span class="transfer-confirm__label">{{ t('transferConfirm.title') }}</span>
          <span class="transfer-confirm__val">{{ info.title || '-' }}</span>
        </div>
        <div class="transfer-confirm__row">
          <span class="transfer-confirm__label">{{ t('transferConfirm.transferNo') }}</span>
          <span class="transfer-confirm__val">{{ transferNo }}</span>
        </div>
      </div>

      <!-- 非微信环境提示 -->
      <div v-if="!isWechat && !isTerminal && !confirmed" class="transfer-confirm__env-tip">
        {{ t('transferConfirm.openInWechat') }}
      </div>

      <!-- 操作按钮 -->
      <div v-if="confirmed" class="transfer-confirm__action">
        <van-button
          round block
          type="primary"
          color="#07c160"
          size="large"
          @click="handleDone"
        >
          {{ t('transferConfirm.done') }}
        </van-button>
      </div>
      <div v-else-if="!isTerminal" class="transfer-confirm__action">
        <van-button
          round block
          type="primary"
          color="#07c160"
          size="large"
          :loading="processing"
          :loading-text="t('transferConfirm.processing')"
          @click="handleConfirm"
        >
          {{ t('transferConfirm.confirm') }}
        </van-button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="less">
.transfer-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  padding: 0;
  background: #fff;

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }

  &__error {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 15px;
    color: #888;
  }

  &__status {
    text-align: center;
    padding: 48px 24px 0;
  }

  &__icon {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 20px;
    font-weight: 500;
    color: #333;
    margin: 0 0 8px;
  }

  &__desc {
    font-size: 14px;
    color: #888;
    margin: 0;
  }

  &__amount {
    display: flex;
    justify-content: center;
    align-items: baseline;
    margin: 40px 0;

    .transfer-confirm__currency {
      font-size: 28px;
      font-weight: 600;
      color: #333;
      margin-right: 4px;
    }

    .transfer-confirm__value {
      font-size: 48px;
      font-weight: 600;
      color: #333;
      line-height: 1;
    }
  }

  &__info {
    width: 100%;
    padding: 0 24px;
    margin-bottom: 32px;

    .transfer-confirm__row {
      display: flex;
      justify-content: space-between;
      padding: 16px 0;
      font-size: 15px;
      border-bottom: 1px solid #f0f0f0;
    }

    .transfer-confirm__label {
      color: #888;
      flex-shrink: 0;
    }

    .transfer-confirm__val {
      color: #333;
      text-align: right;
      word-break: break-all;
      margin-left: 16px;
    }
  }

  &__env-tip {
    font-size: 14px;
    color: #faad14;
    text-align: center;
    padding: 0 24px;
    margin-bottom: 16px;
  }

  &__action {
    width: 100%;
    padding: 24px 32px 48px;
  }
}
</style>
