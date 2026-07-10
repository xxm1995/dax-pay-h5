<script lang="ts" setup>
import type { AuthResult } from '@/shared/api/channel-auth'
import { showFailToast, showSuccessToast } from 'vant'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { authAndGet } from '@/shared/api/channel-auth'
import wechatLogo from '@/shared/assets/icons/channel/wechat.svg'

defineOptions({ name: 'WechatAuthPage' })

const { t } = useI18n()
const route = useRoute()

// 微信 OAuth 重定向回调: path 携带 authToken, query 携带 code
const authToken = route.params.authToken as string
const code = route.query.code as string | undefined

const loading = ref(true)
const authResult = ref<AuthResult>({})
const failed = ref(false)
const failMsg = ref('')

onMounted(() => {
  init()
})

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
 * 页面初始化: 取回调 code + authToken 换取 openId 后回写后端
 */
function init() {
  if (!authToken || !code) {
    markFailed(t('auth.wechat.codeMissing'))
    return
  }
  authAndGet({
    authType: 'wechat',
    authCode: code,
    authToken,
  })
    .then((data) => {
      authResult.value = data ?? {}
      loading.value = false
    })
    .catch((err: Error) => {
      markFailed(err?.message || t('auth.wechat.authFail'))
    })
}

/**
 * 复制用户标识
 */
async function handleCopy() {
  const value = authResult.value.openId
  if (!value) {
    return
  }
  try {
    await navigator.clipboard.writeText(value)
    showSuccessToast(t('auth.wechat.copySuccess'))
  }
  catch {
    showFailToast(t('auth.wechat.copyFail'))
  }
}

/**
 * 返回上一页(微信内嵌浏览器无直接关闭 API, 用历史回退兜底)
 */
function handleBack() {
  if (window.history.length > 1) {
    window.history.back()
  }
  else {
    window.close()
  }
}
</script>

<template>
  <div class="auth-container">
    <!-- 加载中 -->
    <div v-if="loading" class="loading-box">
      <div class="logo-wrapper">
        <img class="channel-logo" :src="wechatLogo" alt="WeChat" width="64" height="64">
      </div>
      <van-loading vertical color="#07c160" size="32px">
        <span class="loading-text">{{ t('auth.wechat.loading') }}</span>
      </van-loading>
      <div class="footer-tip">
        <svg class="tip-icon" viewBox="0 0 1024 1024" width="14" height="14" aria-hidden="true">
          <path fill="#07c160" d="M512 64 128 224v320c0 198 154 366 384 416 230-50 384-218 384-416V224L512 64z m0 380c-70 0-128-58-128-128s58-128 128-128 128 58 128 128-58 128-128 128z" />
        </svg>
        <span>{{ t('auth.wechat.secureTip') }}</span>
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
        {{ t('auth.wechat.failTitle') }}
      </h3>
      <p class="fail-msg">
        {{ failMsg }}
      </p>
      <div class="action-buttons">
        <van-button plain round block class="close-btn" @click="handleBack">
          {{ t('auth.wechat.close') }}
        </van-button>
      </div>
    </div>

    <!-- 成功结果 -->
    <div v-else class="result-box">
      <div class="status-icon">
        <svg viewBox="0 0 1024 1024" width="64" height="64" aria-hidden="true">
          <circle cx="512" cy="512" r="448" fill="#07c160" />
          <path fill="#fff" d="M705.5 289.7L416 615.5 318.5 518l-45.3 45.3L416 706l351.8-351.8-45.3-45.3z" />
        </svg>
      </div>
      <h3 class="result-title">
        {{ t('auth.wechat.successTitle') }}
      </h3>
      <div class="info-card">
        <div class="info-item">
          <span class="label">{{ t('auth.wechat.openId') }}</span>
          <div class="value-box" @click="handleCopy">
            <span class="value">{{ authResult.openId }}</span>
            <svg class="copy-icon" viewBox="0 0 1024 1024" width="16" height="16" aria-hidden="true">
              <path fill="#07c160" d="M768 128H192a64 64 0 0 0-64 64v512h64V192h576V128z m192 192v512a64 64 0 0 1-64 64H384a64 64 0 0 1-64-64V320a64 64 0 0 1 64-64h512a64 64 0 0 1 64 64z m-64 0H384v512h512V320z" />
            </svg>
          </div>
        </div>
      </div>
      <div class="action-buttons">
        <van-button type="primary" color="#07c160" round block @click="handleCopy">
          {{ t('auth.wechat.copy') }}
        </van-button>
        <van-button plain round block class="close-btn" @click="handleBack">
          {{ t('auth.wechat.close') }}
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
      display: flex;
      align-items: center;
      margin-top: 32px;
      font-size: 12px;
      color: #999;

      .tip-icon {
        flex-shrink: 0;
        margin-right: 4px;
      }
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
