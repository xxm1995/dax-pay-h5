<script lang="ts" setup>
import type { AuthResult } from '@/shared/api/channel-auth'
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { authAndGet } from '@/shared/api/channel-auth'
import wechatLogo from '@/shared/assets/icons/channel/wechat.svg'
import { finishGatewayAuthAndRedirect } from '@/shared/utils/auth-return'

defineOptions({ name: 'PcWechatAuth' })

const { t } = useI18n()
const route = useRoute()

// 微信 OAuth 重定向回调: query 携带 code(微信回传) + state(会话标识 authToken)
const authToken = route.query.state as string
const code = route.query.code as string | undefined

const loading = ref(true)
const authResult = ref<AuthResult>({})
const failed = ref(false)
const failMsg = ref('')

// 复制提示浮层（PC 端无 vant，用 auto-hide 轻量 toast 代替）
const toastVisible = ref(false)
const toastMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  init()
})

onUnmounted(() => {
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
})

/**
 * 显示轻量提示（2 秒后自动隐藏）
 */
function showToast(msg: string) {
  toastMsg.value = msg
  toastVisible.value = true
  if (toastTimer) {
    clearTimeout(toastTimer)
  }
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 2000)
}

/**
 * 标记失败状态
 */
function markFailed(msg: string) {
  failed.value = true
  failMsg.value = msg
  loading.value = false
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
      // 网关收银等业务回跳
      if (finishGatewayAuthAndRedirect(authResult.value)) {
        return
      }
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
    showToast(t('auth.wechat.copySuccess'))
  }
  catch {
    showToast(t('auth.wechat.copyFail'))
  }
}

/**
 * 返回上一页（PC 微信内置浏览器无直接关闭 API，用历史回退兜底）
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
  <div class="pc-wechat-auth">
    <div class="pc-wechat-auth__box">
      <!-- 加载中 -->
      <div v-if="loading" class="pc-wechat-auth__panel">
        <div class="pc-wechat-auth__logo">
          <img :src="wechatLogo" alt="WeChat" width="48" height="48">
        </div>
        <div class="pc-wechat-auth__spinner" />
        <p class="pc-wechat-auth__loading-text">
          {{ t('auth.wechat.loading') }}
        </p>
        <div class="pc-wechat-auth__secure-tip">
          <svg viewBox="0 0 1024 1024" width="14" height="14" aria-hidden="true">
            <path fill="#07c160" d="M512 64 128 224v320c0 198 154 366 384 416 230-50 384-218 384-416V224L512 64z m0 380c-70 0-128-58-128-128s58-128 128-128 128 58 128 128-58 128-128 128z" />
          </svg>
          <span>{{ t('auth.wechat.secureTip') }}</span>
        </div>
      </div>

      <!-- 失败 -->
      <div v-else-if="failed" class="pc-wechat-auth__panel">
        <svg class="pc-wechat-auth__status-icon pc-wechat-auth__status-icon--fail" viewBox="0 0 1024 1024" width="64" height="64" aria-hidden="true">
          <circle cx="512" cy="512" r="448" fill="#ee0a24" />
          <path fill="#fff" d="M705.5 625.7l-41.8 41.8L512 515.8 360.3 667.5l-41.8-41.8L470.2 474 318.5 322.3l41.8-41.8L512 432.2l151.7-151.7 41.8 41.8L553.8 474l151.7 151.7z" />
        </svg>
        <h3 class="pc-wechat-auth__result-title">
          {{ t('auth.wechat.failTitle') }}
        </h3>
        <p class="pc-wechat-auth__fail-msg">
          {{ failMsg }}
        </p>
        <button class="pc-wechat-auth__btn pc-wechat-auth__btn--ghost" type="button" @click="handleBack">
          {{ t('auth.wechat.close') }}
        </button>
      </div>

      <!-- 成功结果 -->
      <div v-else class="pc-wechat-auth__panel">
        <svg class="pc-wechat-auth__status-icon" viewBox="0 0 1024 1024" width="64" height="64" aria-hidden="true">
          <circle cx="512" cy="512" r="448" fill="#07c160" />
          <path fill="#fff" d="M705.5 289.7L416 615.5 318.5 518l-45.3 45.3L416 706l351.8-351.8-45.3-45.3z" />
        </svg>
        <h3 class="pc-wechat-auth__result-title">
          {{ t('auth.wechat.successTitle') }}
        </h3>
        <div class="pc-wechat-auth__info-card">
          <span class="pc-wechat-auth__info-label">{{ t('auth.wechat.openId') }}</span>
          <div class="pc-wechat-auth__value-box" @click="handleCopy">
            <span class="pc-wechat-auth__value">{{ authResult.openId }}</span>
            <svg class="pc-wechat-auth__copy-icon" viewBox="0 0 1024 1024" width="16" height="16" aria-hidden="true">
              <path fill="#07c160" d="M768 128H192a64 64 0 0 0-64 64v512h64V192h576V128z m192 192v512a64 64 0 0 1-64 64H384a64 64 0 0 1-64-64V320a64 64 0 0 1 64-64h512a64 64 0 0 1 64 64z m-64 0H384v512h512V320z" />
            </svg>
          </div>
        </div>
        <button class="pc-wechat-auth__btn pc-wechat-auth__btn--primary" type="button" @click="handleCopy">
          {{ t('auth.wechat.copy') }}
        </button>
        <button class="pc-wechat-auth__btn pc-wechat-auth__btn--ghost" type="button" @click="handleBack">
          {{ t('auth.wechat.close') }}
        </button>
      </div>
    </div>

    <!-- 轻量提示浮层 -->
    <Transition name="pc-wechat-auth-toast">
      <div v-if="toastVisible" class="pc-wechat-auth__toast">
        {{ toastMsg }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* PC 端微信认证落地页：scoped 原生 px + 媒体查询，不使用 UnoCSS 的 px 原子类 */
.pc-wechat-auth {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background: linear-gradient(180deg, var(--h5-bg-page) 0%, var(--h5-bg-muted) 100%);
  box-sizing: border-box;
}

.pc-wechat-auth__box {
  width: 100%;
  max-width: 440px;
}

.pc-wechat-auth__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 40px;
  background: var(--h5-bg-card);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06);
}

/* 加载态 */
.pc-wechat-auth__logo {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
}

.pc-wechat-auth__logo img {
  display: block;
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.pc-wechat-auth__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #e4f3eb;
  border-top-color: #07c160;
  border-radius: 50%;
  animation: pc-wechat-auth-spin 0.8s linear infinite;
}

@keyframes pc-wechat-auth-spin {
  to {
    transform: rotate(360deg);
  }
}

.pc-wechat-auth__loading-text {
  margin: 18px 0 0;
  font-size: 15px;
  color: var(--h5-text-secondary);
}

.pc-wechat-auth__secure-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 36px;
  font-size: 13px;
  color: var(--h5-text-secondary);
}

/* 状态图标 */
.pc-wechat-auth__status-icon {
  margin-bottom: 18px;
}

.pc-wechat-auth__result-title {
  margin: 0 0 28px;
  font-size: 22px;
  font-weight: 600;
  color: var(--h5-text-primary);
}

.pc-wechat-auth__fail-msg {
  margin: 0 0 32px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--h5-text-secondary);
  text-align: center;
  word-break: break-all;
}

/* 信息卡片 */
.pc-wechat-auth__info-card {
  width: 100%;
  padding: 18px;
  margin-bottom: 36px;
  background: var(--h5-bg-muted);
  border-radius: 12px;
}

.pc-wechat-auth__info-label {
  display: block;
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--h5-text-secondary);
}

.pc-wechat-auth__value-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  background: var(--h5-bg-card);
  border: 1px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.pc-wechat-auth__value-box:hover {
  background: var(--h5-bg-page);
}

.pc-wechat-auth__value {
  flex: 1;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 14px;
  color: var(--h5-text-primary);
  word-break: break-all;
}

.pc-wechat-auth__copy-icon {
  flex-shrink: 0;
}

/* 按钮 */
.pc-wechat-auth__btn {
  width: 100%;
  height: 46px;
  font-size: 15px;
  font-weight: 500;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pc-wechat-auth__btn--primary {
  color: #fff;
  background: #07c160;
  box-shadow: 0 6px 16px rgba(7, 193, 96, 0.28);
}

.pc-wechat-auth__btn--primary:hover {
  background: #06ad55;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(7, 193, 96, 0.36);
}

.pc-wechat-auth__btn--ghost {
  margin-top: 12px;
  color: var(--h5-text-secondary);
  background: var(--h5-bg-card);
  border: 1px solid #ebeef5;
}

.pc-wechat-auth__btn--ghost:hover {
  color: #07c160;
  border-color: #07c160;
  background: var(--h5-bg-muted);
}

/* 轻量提示浮层 */
.pc-wechat-auth__toast {
  position: fixed;
  top: 40px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  font-size: 14px;
  color: #fff;
  background: rgba(29, 33, 41, 0.9);
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  z-index: 9999;
}

.pc-wechat-auth-toast-enter-active,
.pc-wechat-auth-toast-leave-active {
  transition: all 0.25s ease;
}

.pc-wechat-auth-toast-enter-from,
.pc-wechat-auth-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -12px);
}
</style>
