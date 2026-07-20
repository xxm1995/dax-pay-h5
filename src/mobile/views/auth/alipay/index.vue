<script lang="ts" setup>
/**
 * 支付宝 OAuth 重定向回调落地页
 *
 * 网关收银/聚合/码牌流程下：拿到 userId/openId 后由 finishGatewayAuthAndRedirect 直接
 * 落盘 sessionStorage 并 location.replace 回业务页，本页始终处于 loading 态直到跳走，
 * 不再展示"成功结果 + 复制 userId"分支（仅调试场景才用得到，已移除以减少视觉跳变）。
 *
 * 仅保留失败兜底：缺 auth_code/state 或后端换 userId 失败时显示错误卡 + 关闭按钮。
 */
import { showFailToast } from 'vant'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { authAndGet } from '@/shared/api/channel-auth'
import InitLoadingMask from '@/shared/components/pay/InitLoadingMask.vue'
import { finishGatewayAuthAndRedirect } from '@/shared/utils/auth-return'

defineOptions({ name: 'AlipayAuthPage' })

const { t } = useI18n()
const route = useRoute()

// 支付宝 OAuth 重定向回调: query 携带 auth_code(支付宝回传) + state(会话标识 authToken)
const authToken = route.query.state as string
const code = route.query.auth_code as string | undefined

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
  showFailToast(msg)
}

/**
 * 页面初始化: 取回调 auth_code + authToken 换取 userId 后回写后端
 *
 * 提前到 setup 顶层执行（不等 onMounted），减少 Vue 挂载到 init 的间隙
 */
function init() {
  if (!authToken || !code) {
    markFailed(t('auth.alipay.codeMissing'))
    return
  }
  authAndGet({
    authType: 'alipay',
    authCode: code,
    authToken,
  })
    .then((data) => {
      // 网关收银等业务回跳
      if (finishGatewayAuthAndRedirect(data ?? {})) {
        return
      }
      markFailed(t('auth.alipay.authFail'))
    })
    .catch((err: Error) => {
      markFailed(err?.message || t('auth.alipay.authFail'))
    })
}

// 立即触发（不等 onMounted，减少白屏时间）
init()

/**
 * 关闭支付宝内嵌 WebView
 */
function handleClose() {
  try {
    // 支付宝环境可能注入 AlipayJSBridge
    const bridge = (window as unknown as { AlipayJSBridge?: { call: (name: string) => void } }).AlipayJSBridge
    if (bridge) {
      bridge.call('closeWebview')
      return
    }
  }
  catch {
    // 非支付宝环境忽略
  }
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
    <!-- 加载中：统一全屏遮罩（中性文案不暴露"获取信息"细节） -->
    <InitLoadingMask
      v-if="loading"
      brand-color="#1677ff"
      tip-key="common.processing"
    />

    <!-- 失败兜底 -->
    <div v-else-if="failed" class="result-box">
      <div class="status-icon">
        <svg viewBox="0 0 1024 1024" width="64" height="64" aria-hidden="true">
          <circle cx="512" cy="512" r="448" fill="#ee0a24" />
          <path fill="#fff" d="M705.5 625.7l-41.8 41.8L512 515.8 360.3 667.5l-41.8-41.8L470.2 474 318.5 322.3l41.8-41.8L512 432.2l151.7-151.7 41.8 41.8L553.8 474l151.7 151.7z" />
        </svg>
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
  background-color: var(--h5-bg-page);

  .result-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 340px;
    padding: 40px 24px;
    background: var(--h5-bg-card);
    border-radius: 16px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 5%);

    .status-icon {
      margin-bottom: 16px;
      line-height: 0;
    }

    .result-title {
      margin: 0 0 24px;
      font-size: 20px;
      font-weight: 600;
      color: var(--h5-text-primary);
    }

    .fail-msg {
      margin: 0 0 24px;
      font-size: 14px;
      color: var(--h5-text-secondary);
      text-align: center;
      word-break: break-all;
    }

    .action-buttons {
      width: 100%;

      .close-btn {
        color: var(--h5-text-secondary);
        border-color: var(--h5-border);
      }
    }
  }
}
</style>
