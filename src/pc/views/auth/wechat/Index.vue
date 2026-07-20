<script lang="ts" setup>
/**
 * PC 微信 OAuth 重定向回调落地页
 *
 * 网关收银/聚合流程下：拿到 openId 后由 finishGatewayAuthAndRedirect 直接
 * 落盘 sessionStorage 并 location.replace 回业务页，本页始终处于 loading 态直到跳走，
 * 不再展示"成功结果 + 复制 openId"分支（仅调试场景才用得到，已移除以减少视觉跳变）。
 *
 * 仅保留失败兜底：缺 code/state 或后端换 openId 失败时显示错误卡 + 关闭按钮。
 */
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { authAndGet } from '@/shared/api/channel-auth'
import InitLoadingMask from '@/shared/components/pay/InitLoadingMask.vue'
import { finishGatewayAuthAndRedirect } from '@/shared/utils/auth-return'

defineOptions({ name: 'PcWechatAuth' })

const { t } = useI18n()
const route = useRoute()

// 微信 OAuth 重定向回调: query 携带 code(微信回传) + state(会话标识 authToken)
const authToken = route.query.state as string
const code = route.query.code as string | undefined

const loading = ref(true)
const failed = ref(false)
const failMsg = ref('')

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
 *
 * 提前到 setup 顶层执行（不等 onMounted），减少 Vue 挂载到 init 的间隙
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
      // 网关收银等业务回跳
      if (finishGatewayAuthAndRedirect(data ?? {})) {
        return
      }
      markFailed(t('auth.wechat.authFail'))
    })
    .catch((err: Error) => {
      markFailed(err?.message || t('auth.wechat.authFail'))
    })
}

// 立即触发（不等 onMounted，减少白屏时间）
init()

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
    <!-- 加载中：统一全屏遮罩（与移动端视觉一致，中性文案） -->
    <InitLoadingMask
      v-if="loading"
      brand-color="#07c160"
      tip-key="common.processing"
    />

    <!-- 失败兜底 -->
    <div v-else-if="failed" class="pc-wechat-auth__panel">
      <svg class="pc-wechat-auth__status-icon" viewBox="0 0 1024 1024" width="64" height="64" aria-hidden="true">
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

.pc-wechat-auth__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 40px;
  background: var(--h5-bg-card);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.06);
  max-width: 440px;
  width: 100%;
}

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

.pc-wechat-auth__btn--ghost {
  color: var(--h5-text-secondary);
  background: var(--h5-bg-card);
  border: 1px solid #ebeef5;
}

.pc-wechat-auth__btn--ghost:hover {
  color: #07c160;
  border-color: #07c160;
  background: var(--h5-bg-muted);
}
</style>
