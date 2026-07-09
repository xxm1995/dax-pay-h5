<script lang="ts" setup>
import type { AuthResult } from '@/shared/api/channel-auth'
import { showFailToast, showSuccessToast } from 'vant'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { authAndGet } from '@/shared/api/channel-auth'

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
        <div class="channel-logo">
          微
        </div>
      </div>
      <van-loading vertical color="#07c160" size="32px">
        <span class="loading-text">{{ t('auth.wechat.loading') }}</span>
      </van-loading>
      <div class="footer-tip">
        <van-icon name="shield-o" />
        <span>{{ t('auth.wechat.secureTip') }}</span>
      </div>
    </div>

    <!-- 失败 -->
    <div v-else-if="failed" class="result-box">
      <div class="status-icon">
        <van-icon name="close" color="#ee0a24" size="64px" />
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
        <van-icon name="checked" color="#07c160" size="64px" />
      </div>
      <h3 class="result-title">
        {{ t('auth.wechat.successTitle') }}
      </h3>
      <div class="info-card">
        <div class="info-item">
          <span class="label">{{ t('auth.wechat.openId') }}</span>
          <div class="value-box" @click="handleCopy">
            <span class="value">{{ authResult.openId }}</span>
            <van-icon name="records" class="copy-icon" />
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
        display: flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        font-size: 28px;
        font-weight: 700;
        color: #fff;
        background: linear-gradient(135deg, #07c160, #5fd39a);
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
        color: #07c160;
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
            color: #07c160;
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
