import type { Router } from 'vue-router'
import { watch } from 'vue'
import i18n, { t } from '@/shared/locales'

/** 根据路由 meta.title（i18n key）设置浏览器标题 */
function applyRouteDocumentTitle(router: Router) {
  const key = router.currentRoute.value.meta?.title as string | undefined
  if (key) {
    // 路由页标题
    document.title = t(key)
  }
}

/**
 * PC 端路由守卫
 *
 * 仅处理 document.title 切换：当目标路由（或其 matched 链上任意父级）
 * 声明了 meta.title（i18n key）时，用 t() 解析后更新；否则保留当前 title（通常为
 * 站点 systemName，由 [applyWebsiteBranding] 设置）。
 *
 * 与 mobile/router/router-guards.ts 对称实现，去掉 keepAlive 逻辑
 * （PC 端无 keepAlive 需求）。
 */
export function createPcRouterGuards(router: Router) {
  router.afterEach((to) => {
    // 设置每个页面的 title（meta.title 存 i18n key）
    const titleKey = to?.meta?.title as string | undefined
    if (titleKey) {
      document.title = t(titleKey)
    }
  })

  // 切换语言时刷新当前页 document.title
  watch(
    () => i18n.global.locale.value,
    () => {
      applyRouteDocumentTitle(router)
    },
  )
}
