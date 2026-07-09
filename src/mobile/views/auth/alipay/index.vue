<script lang="ts" setup>
import type { AuthResult } from '@/shared/api/channel-auth'
import { showFailToast, showSuccessToast } from 'vant'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { authAndGet } from '@/shared/api/channel-auth'

defineOptions({ name: 'AlipayAuthPage' })

// AlipayJSAPI 全局类型
declare const ap: {
  getAuthCode: (
    options: { appId: string | string[], scopes: string[] },
    callback: (res: { authCode?: string, error?: number, errorMessage?: string }) => void,
  ) => void
}

declare const AlipayJSBridge: {
  call: (name: string) => void
}

const { t } = useI18n()
const route = useRoute()

const aliAppId = route.params.aliAppId as string
const queryCode = route.params.queryCode as string

const loading = ref(true)
const authResult = ref<AuthResult>({})
const failed = ref(false)
const failMsg = ref('')

// 动态加载支付宝 JSAPI
const script = document.createElement('script')
script.setAttribute(
  'src',
  'https://gw.alipayobjects.com/as/g/h5-lib/alipayjsapi/3.1.1/alipayjsapi.min.js',
)
document.head.appendChild(script)
script.onload = () => {
  init()
}
script.onerror = () => {
  markFailed(t('auth.alipay.sdkLoadFail'))
}

/**
 * 标记失败状态
 */
function markFailed(msg: string) {
  failed.value = true
  failMsg.value = msg
  loading.value = false
  showFailToast(msg)
}

/**
 * 页面初始化: JSAPI 取 authCode 后回写后端
 */
function init() {
  if (!aliAppId || !queryCode) {
    markFailed(t('auth.alipay.paramMissing'))
    return
  }
  ap.getAuthCode(
    {
      appId: aliAppId,
      scopes: ['auth_base'],
    },
    (res) => {
      if (!res.authCode) {
        markFailed(res.errorMessage || t('auth.alipay.authCodeFail'))
        return
      }
      authAndGet({
        authType: 'alipay',
        authCode: res.authCode,
        queryCode,
      })
        .then((data) => {
          authResult.value = data ?? {}
          loading.value = false
        })
        .catch((err: Error) => {
          markFailed(err?.message || t('auth.alipay.authFail'))
        })
    },
  )
}

/**
 * 复制用户标识
 */
async function handleCopy() {
  const value = authResult.value.userId || authResult.value.openId
  if (!value) {
    return
  }
  try {
    await navigator.clipboard.writeText(value)
    showSuccessToast(t('auth.alipay.copySuccess'))
  }
  catch {
    showFailToast(t('auth.alipay.copyFail'))
  }
}

/**
 * 关闭支付宝内嵌 WebView
 */
function handleClose() {
  try {
    AlipayJSBridge.call('closeWebview')
  }
  catch {
    // 非支付宝环境忽略
  }
}
</script>

<template>
  <div class="auth-container">
    <!-- 加载中 -->
    <div v-if="loading" class="loading-box">
      <div class="logo-wrapper">
        <div class="channel-logo">
          支
        </div>
      </div>
      <van-loading vertical color="#1677ff" size="32px">
        <span class="loading-text">{{ t('auth.alipay.loading') }}</span>
      </van-loading>
      <div class="footer-tip">
        <van-icon name="shield-o" />
        <span>{{ t('auth.alipay.secureTip') }}</span>
      </div>
    </div>

    <!-- 失败 -->
    <div v-else-if="failed" class="result-box">
      <div class="status-icon">
        <van-icon name="close" color="#ee0a24" size="64px" />
      </div>
      <h3 class="result-title">
        {{ t('auth.alipay.failTitle') }}
      </h3>
      <p class="fail-msg">
        {{ failMsg }}
      </p>
      <div class="action-buttons">
        <van-button plain round block class="close-btn" @click="handleClose">
          {{ t('auth.alipay.close') }}
        </van-button>
      </div>
    </div>

    <!-- 成功结果 -->
    <div v-else class="result-box">
      <div class="status-icon">
        <van-icon name="checked" color="#07c160" size="64px" />
      </div>
      <h3 class="result-title">
        {{ t('auth.alipay.successTitle') }}
      </h3>
      <div class="info-card">
        <div class="info-item">
          <span class="label">{{ t('auth.alipay.userId') }}</span>
          <div class="value-box" @click="handleCopy">
            <span class="value">{{ authResult.userId || authResult.openId }}</span>
            <van-icon name="records" class="copy-icon" />
          </div>
        </div>
      </div>
      <div class="action-buttons">
        <van-button type="primary" color="#1677ff" round block @click="handleCopy">
          {{ t('auth.alipay.copy') }}
        </van-button>
        <van-button plain round block class="close-btn" @click="handleClose">
          {{ t('auth.alipay.close') }}
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
        display: flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        font-size: 28px;
        font-weight: 700;
        color: #fff;
        background: linear-gradient(135deg, #1677ff, #69b1ff);
        border-radius: 16px;
      }
    }

    .loading-text {
      margin-top: 12px;
      font-size: 14px;
      color: #666;
    }

    .footer-tip {
      display: flex;
      align-items: center;
      margin-top: 32px;
      font-size: 12px;
      color: #999;

      .van-icon {
        margin-right: 4px;
        font-size: 14px;
        color: #1677ff;
      }
    }
  }

  .result-box {
    .status-icon {
      margin-bottom: 16px;
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

    .info-card {
      width: 100%;
      padding: 16px;
      margin-bottom: 32px;
      background: #f8f9fa;
      border-radius: 12px;

      .info-item {
        .label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          color: #999;
        }

        .value-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          cursor: pointer;
          background: #fff;
          border: 1px solid #eee;
          border-radius: 8px;

          &:active {
            background: #f0f0f0;
          }

          .value {
            margin-right: 8px;
            font-family: monospace;
            font-size: 14px;
            color: #333;
            word-break: break-all;
          }

          .copy-icon {
            flex-shrink: 0;
            font-size: 16px;
            color: #1677ff;
          }
        }
      }
    }

    .action-buttons {
      width: 100%;

      .close-btn {
        margin-top: 12px;
        color: #666;
        border-color: #eee;
      }
    }
  }
}
</style>
