<script lang="ts" setup>
/**
 * 通道 OAuth 重定向回调共享落地页
 *
 * 由 wechat / alipay / douyin 三个薄壳通过 `channel` prop 驱动, 差异点(codeField /
 * brandColor / i18n 命名空间) 内化到 CHANNEL_CONFIG 配置表, 消除三份高度重复的实现。
 *
 * 两种落地场景:
 * - **网关业务场景**(收银/聚合/码牌): 拿到 openId/userId 后由 finishGatewayAuthAndRedirect
 *   直接落盘 sessionStorage 并 location.replace 回业务页, 本页始终处于 loading 态直到跳走
 * - **调试场景**(Web 端 ChannelAuth 扫码): AuthSession 无 returnPath, 拿到标识后
 *   展示"获取成功"卡片(点击即可复制), 供 PC 端扫码调试查看
 *
 * 失败兜底: 缺 code/state 或后端换标识失败时显示错误卡 + 关闭按钮。
 */
import { showFailToast, showSuccessToast } from 'vant'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { authAndGet } from '@/shared/api/channel-auth'
import InitLoadingMask from '@/shared/components/pay/InitLoadingMask.vue'
import { closeWebview } from '@/shared/pay/close-webview'
import { finishGatewayAuthAndRedirect } from '@/shared/utils/auth-return'

type AuthChannel = 'wechat' | 'alipay' | 'douyin'

interface ChannelConfig {
  /** query 中取 code 用的字段名(支付宝回传 auth_code, 其余回传 code) */
  codeField: 'code' | 'auth_code'
  /** 品牌色(loading 圈色 + 调试卡片 value 色) */
  brandColor: string
  /** i18n 命名空间(对应 auth.json 中的 wechat/alipay/douyin 组) */
  i18nNs: string
  /**
   * 标识字段名(用于调试卡片 label i18n key 拼接)
   * wechat/douyin 用 openId, alipay 用 userId(C 方案 i18n 重组后统一为 identifierLabel)
   */
  identifierKey: 'openId' | 'userId'
}

const props = defineProps<{ channel: AuthChannel }>()

const CHANNEL_CONFIG: Record<AuthChannel, ChannelConfig> = {
  wechat: { codeField: 'code', brandColor: '#07c160', i18nNs: 'wechat', identifierKey: 'openId' },
  alipay: { codeField: 'auth_code', brandColor: '#1677ff', i18nNs: 'alipay', identifierKey: 'userId' },
  douyin: { codeField: 'code', brandColor: '#161823', i18nNs: 'douyin', identifierKey: 'openId' },
}

const cfg = computed(() => CHANNEL_CONFIG[props.channel])

const { t } = useI18n()
const route = useRoute()

// OAuth 重定向回调: query 携带 code(微信/抖音) 或 auth_code(支付宝) + state(会话标识 authToken)
const authToken = route.query.state as string
const code = route.query[cfg.value.codeField] as string | undefined

const loading = ref(true)
const failed = ref(false)
const failMsg = ref('')
// 调试场景(Web 端 ChannelAuth 扫码)成功态: 展示可点击复制的标识卡片
const success = ref(false)
const identifierValue = ref('')

/**
 * 标记调试场景成功: 无 returnPath 但后端已返回 openId/userId
 * 展示可点击复制的标识卡片, 供 PC 端扫码调试查看
 */
function markSuccess(identifier: string) {
  success.value = true
  identifierValue.value = identifier
  loading.value = false
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
 * 页面初始化: 取回调 code + authToken 换取 openId/userId 后回写后端
 *
 * 提前到 setup 顶层执行(不等 onMounted), 减少 Vue 挂载到 init 的间隙,
 * 让 InitLoadingMask 第一时间接管视觉
 */
function init() {
  if (!authToken || !code) {
    markFailed(t(`auth.${cfg.value.i18nNs}.codeMissing`))
    return
  }
  authAndGet({
    authType: props.channel,
    authCode: code,
    authToken,
  })
    .then((data) => {
      // 网关业务回跳: 有 returnPath 则落盘 openId/userId 并跳转业务页
      if (finishGatewayAuthAndRedirect(data ?? {})) {
        return
      }
      // 调试场景: 无 returnPath 但拿到标识, 展示成功卡片(供 PC 端扫码调试查看)
      const identifier = data?.openId || data?.userId
      if (identifier) {
        markSuccess(identifier)
        return
      }
      // 真正失败: 既无 returnPath 也无标识
      markFailed(t(`auth.${cfg.value.i18nNs}.authFail`))
    })
    .catch((err: Error) => {
      markFailed(err?.message || t(`auth.${cfg.value.i18nNs}.authFail`))
    })
}

// 立即触发(不等 onMounted, 减少白屏时间)
init()

/**
 * 复制标识到剪贴板(兼容微信/支付宝/抖音内嵌 WebView 的 navigator.clipboard 缺失场景)
 */
async function copyIdentifier() {
  if (!identifierValue.value) {
    return
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(identifierValue.value)
    }
    else {
      // 兜底: 临时 textarea + execCommand('copy')
      const textarea = document.createElement('textarea')
      textarea.value = identifierValue.value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    showSuccessToast(t(`auth.${cfg.value.i18nNs}.copySuccess`))
  }
  catch {
    showFailToast(t(`auth.${cfg.value.i18nNs}.copyFail`))
  }
}
</script>

<template>
  <div class="auth-container">
    <!-- 加载中：统一全屏遮罩(与业务页视觉一致, 中性文案不暴露"获取信息"细节) -->
    <InitLoadingMask
      v-if="loading"
      :brand-color="cfg.brandColor"
      tip-key="common.processing"
    />

    <!-- 调试场景成功卡片(无 returnPath, 展示可复制的 openId/userId) -->
    <div v-else-if="success" class="result-box">
      <div class="status-icon">
        <svg viewBox="0 0 1024 1024" width="64" height="64" aria-hidden="true">
          <circle cx="512" cy="512" r="448" fill="#07c160" />
          <path fill="#fff" d="M432 660.3l-145.6-145.6 45.2-45.2L432 569.7l260.4-260.4 45.2 45.2z" />
        </svg>
      </div>
      <h3 class="result-title">
        {{ t(`auth.${cfg.i18nNs}.successTitle`) }}
      </h3>
      <div class="identifier-card" @click="copyIdentifier">
        <span class="card-label">{{ t(`auth.${cfg.i18nNs}.${cfg.identifierKey}`) }}</span>
        <div class="card-value" :style="{ color: cfg.brandColor }">
          {{ identifierValue }}
        </div>
        <span class="copy-hint">{{ t(`auth.${cfg.i18nNs}.copy`) }}</span>
      </div>
      <div class="action-buttons">
        <van-button plain round block class="close-btn" @click="closeWebview">
          {{ t(`auth.${cfg.i18nNs}.close`) }}
        </van-button>
      </div>
    </div>

    <!-- 失败兜底 -->
    <div v-else-if="failed" class="result-box">
      <div class="status-icon">
        <svg viewBox="0 0 1024 1024" width="64" height="64" aria-hidden="true">
          <circle cx="512" cy="512" r="448" fill="#ee0a24" />
          <path fill="#fff" d="M705.5 625.7l-41.8 41.8L512 515.8 360.3 667.5l-41.8-41.8L470.2 474 318.5 322.3l41.8-41.8L512 432.2l151.7-151.7 41.8 41.8L553.8 474l151.7 151.7z" />
        </svg>
      </div>
      <h3 class="result-title">
        {{ t(`auth.${cfg.i18nNs}.failTitle`) }}
      </h3>
      <p class="fail-msg">
        {{ failMsg }}
      </p>
      <div class="action-buttons">
        <van-button plain round block class="close-btn" @click="closeWebview">
          {{ t(`auth.${cfg.i18nNs}.close`) }}
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

    // 调试场景: 标识展示卡片(可点击复制)
    .identifier-card {
      width: 100%;
      margin: 0 0 20px;
      padding: 14px 16px;
      background: var(--h5-bg-page);
      border-radius: 10px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:active {
        background: rgb(0 0 0 / 6%);
      }

      .card-label {
        display: block;
        margin-bottom: 6px;
        font-size: 12px;
        font-weight: 600;
        color: var(--h5-text-secondary);
        letter-spacing: 0.05em;
      }

      .card-value {
        font-size: 14px;
        font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
        word-break: break-all;
      }

      .copy-hint {
        display: block;
        margin-top: 8px;
        font-size: 12px;
        color: var(--h5-text-secondary);
        text-align: right;
      }
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
