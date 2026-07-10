<script lang="ts" setup>
import { showDialog } from 'vant'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { isvAuthCallback } from '@/shared/api/isv-auth'
import alipayLogo from '@/shared/assets/icons/channel/alipay.svg'

defineOptions({ name: 'AlipayIsvAuthPage' })

declare const AlipayJSBridge: {
  call: (name: string) => void
}

const { t } = useI18n()
const route = useRoute()

const loading = ref(true)
const failed = ref(false)
const failMsg = ref('')

/**
 * Base64 解码 state(通道商户号)
 */
function base64Decode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map(c => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
      .join(''),
  )
}

/**
 * 标记失败
 */
function markFailed(msg: string) {
  failed.value = true
  failMsg.value = msg
  loading.value = false
}

/**
 * 关闭支付宝内嵌 WebView
 */
function handleClose() {
  try {
    if (typeof AlipayJSBridge !== 'undefined') {
      AlipayJSBridge.call('closeWebview')
      return
    }
  }
  catch {
    // 非支付宝环境忽略
  }
  window.history.back()
}

onMounted(() => {
  const appAuthCode = route.query.app_auth_code as string | undefined
  const state = route.query.state as string | undefined

  if (!appAuthCode) {
    markFailed(t('isvAuth.alipay.authCodeMissing'))
    return
  }
  if (!state) {
    markFailed(t('isvAuth.alipay.stateMissing'))
    return
  }

  let channelMchNo = ''
  try {
    channelMchNo = base64Decode(state)
  }
  catch {
    markFailed(t('isvAuth.alipay.stateInvalid'))
    return
  }
  if (!channelMchNo) {
    markFailed(t('isvAuth.alipay.stateInvalid'))
    return
  }

  isvAuthCallback({
    channelMchNo,
    code: appAuthCode,
  })
    .then(() => {
      loading.value = false
      showDialog({
        message: t('isvAuth.alipay.successMsg'),
        confirmButtonText: t('isvAuth.alipay.close'),
      }).then(() => {
        handleClose()
      })
    })
    .catch((err: Error) => {
      markFailed(err?.message || t('isvAuth.alipay.authFail'))
    })
})
</script>

<template>
  <div class="auth-container">
    <!-- 加载中 -->
    <div v-if="loading" class="loading-box">
      <div class="logo-wrapper">
        <img class="channel-logo" :src="alipayLogo" alt="Alipay" width="64" height="64">
      </div>
      <van-loading vertical color="#1677ff" size="32px">
        <span class="loading-text">{{ t('isvAuth.alipay.loading') }}</span>
      </van-loading>
      <div class="footer-tip">
        <span>{{ t('isvAuth.alipay.secureTip') }}</span>
      </div>
    </div>

    <!-- 失败 -->
    <div v-else-if="failed" class="result-box">
      <div class="status-icon">
        <svg viewBox="0 0 1024 1024" width="64" height="64" aria-hidden="true">
          <circle cx="512" cy="512" r="448" fill="#ee0a24" />
          <path fill="#fff" d="M705.5 625.7l-41.8 41.8L512 515.8 360.3 667.5l-41.8-41.8L470.2 474 318.5 322.3l41.8-41.8L512 432.2l151.7-151.7 41.8 41.8L553.8 474l151.7 151.7z" />
        </svg>
      </div>
      <h3 class="result-title">
        {{ t('isvAuth.alipay.failTitle') }}
      </h3>
      <p class="fail-msg">
        {{ failMsg }}
      </p>
      <div class="action-buttons">
        <van-button plain round block class="close-btn" @click="handleClose">
          {{ t('isvAuth.alipay.close') }}
        </van-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="less">
.auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;

  .loading-box,
  .result-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 340px;
    padding: 40px 24px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 5%);
  }

  .loading-box {
    .logo-wrapper {
      margin-bottom: 24px;

      .channel-logo {
        display: block;
        width: 64px;
        height: 64px;
        object-fit: contain;
      }
    }

    .loading-text {
      margin-top: 12px;
      font-size: 14px;
      color: #666;
    }

    .footer-tip {
      margin-top: 32px;
      font-size: 12px;
      color: #999;
    }
  }

  .result-box {
    .status-icon {
      margin-bottom: 16px;
      line-height: 0;
    }

    .result-title {
      margin: 0 0 24px;
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }

    .fail-msg {
      margin: 0 0 24px;
      font-size: 14px;
      color: #666;
      text-align: center;
      word-break: break-all;
    }

    .action-buttons {
      width: 100%;

      .close-btn {
        color: #666;
        border-color: #eee;
      }
    }
  }
}
</style>
