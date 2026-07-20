/**
 * 网关 OAuth 触发编排 composable
 *
 * 收敛起聚合([useAggregatePay#ensureOpenId])、收银台(CashierEnvPage#ensureOpenIdOrRedirect)、
 * 码牌([useCodePayPage] init 内联) 三处的 OAuth 跳转逻辑, 消除重复实现。
 *
 * 差异点通过 options 注入:
 * - `generateAuthUrl`: 聚合/收银台用 [generateGatewayAuthUrl], 码牌用 [generateCodeAuthUrl]
 * - `onError`: 错误回调(可抛错由上层 catch 接管, 或写入 loadError ref)
 * - `failKey`: 失败文案 i18n key
 * - `redirect`: 聚合/收银台用 `href` 保留 history, 码牌用 `replace` 替换 history
 *
 * 必须在 setup 上下文中调用(内部依赖 [useI18n])
 */
import type { Ref } from 'vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

/** OAuth URL 生成器: 返回含 authUrl 的对象, 失败返回 null 或抛错 */
export type GenerateAuthUrlFn = () => Promise<{ authUrl?: string } | null>

export interface UseGatewayAuthOptions {
  /** OAuth URL 生成器 */
  generateAuthUrl: GenerateAuthUrlFn
  /** 失败回调(可抛错由上层 catch 接管, 或写入调用方的 loadError ref) */
  onError?: (message: string) => void
  /** 失败文案 i18n key(如 aggregate.authFail / cashier.authUrlFail / codePay.authUrlFail) */
  failKey: string
  /**
   * 跳转方式
   * - `href` (默认): `location.href`, 聚合/收银台用, 保留 history
   * - `replace`: `location.replace`, 码牌用, 替换当前 history 避免返回键回到中转页
   */
  redirect?: 'href' | 'replace'
}

export interface UseGatewayAuthReturn {
  /** 是否正在跳转 OAuth(供模板 v-if 控制遮罩) */
  authorizing: Ref<boolean>
  /**
   * 确保 openId 已获取; 未获取则触发 OAuth 跳转
   *
   * 触发时机由调用方决定:
   * - 聚合: bootstrap() 阶段(meta.needOpenId)
   * - 收银台: pay() 阶段(用户点支付后)
   * - 码牌: init() 阶段(info.needOpenId, UI 渲染之前)
   *
   * @param needOpenId     后端返回的 needOpenId(meta/info)
   * @param existingOpenId 已从 sessionStorage 恢复的 openId
   * @returns `true`=已有 openId 可继续; `false`=已触发跳转或失败(调用方应中止后续流程)
   */
  ensureOpenId: (
    needOpenId: boolean | undefined,
    existingOpenId: string | undefined,
  ) => Promise<boolean>
}

export function useGatewayAuth(options: UseGatewayAuthOptions): UseGatewayAuthReturn {
  const { generateAuthUrl, onError, failKey, redirect = 'href' } = options
  const { t } = useI18n()
  const authorizing = ref(false)

  async function ensureOpenId(
    needOpenId: boolean | undefined,
    existingOpenId: string | undefined,
  ): Promise<boolean> {
    if (!needOpenId) {
      return true
    }
    if (existingOpenId) {
      return true
    }
    authorizing.value = true
    try {
      const result = await generateAuthUrl()
      if (!result?.authUrl) {
        onError?.(t(failKey))
        return false
      }
      if (redirect === 'replace') {
        // 码牌场景: replace 避免返回键回到 OAuth 中转页
        window.location.replace(result.authUrl)
      }
      else {
        // 聚合/收银台场景: href 保留 history
        window.location.href = result.authUrl
      }
      return false
    }
    catch (e: any) {
      // onError 抛错时会再次进入这里; 此时直接向上传播(已在 onError 中包装过 message)
      if (e?.message) {
        onError?.(e?.message)
      }
      else {
        onError?.(t(failKey))
      }
      return false
    }
    finally {
      authorizing.value = false
    }
  }

  return { authorizing, ensureOpenId }
}
