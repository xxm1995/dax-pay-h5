import { showFailToast } from 'vant'
import { t } from '@/shared/locales'

/**
 * HTTP 状态码错误提示
 *
 * - 400 及未知状态：提示后端返回的 `msg`（动态内容，不翻译）
 * - 401/403/404/405/408/500/501/502/503/504/505：固定文案，走 i18n（http.status.{code}）
 */
export function checkStatus(status: number, msg: string): void {
  switch (status) {
    case 400:
      showFailToast(msg)
      break
    // 401: 未登录
    // 未登录则跳转登录页面，并携带当前页面的路径
    // 在登录成功后返回当前页面，这一步需要在登录页操作。
    case 401:
      showFailToast(t(`http.status.401`))
      break
    case 403:
      showFailToast(t('http.status.403'))
      break
    // 404请求不存在
    case 404:
      showFailToast(t('http.status.404'))
      break
    case 405:
      showFailToast(t('http.status.405'))
      break
    case 408:
      showFailToast(t('http.status.408'))
      break
    case 500:
      showFailToast(t('http.status.500'))
      break
    case 501:
      showFailToast(t('http.status.501'))
      break
    case 502:
      showFailToast(t('http.status.502'))
      break
    case 503:
      showFailToast(t('http.status.503'))
      break
    case 504:
      showFailToast(t('http.status.504'))
      break
    case 505:
      showFailToast(t('http.status.505'))
      break
    default:
      showFailToast(msg)
  }
}
