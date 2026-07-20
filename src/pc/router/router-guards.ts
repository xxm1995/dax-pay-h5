import type { Router } from 'vue-router'

/**
 * PC 端路由守卫
 *
 * 仅处理 document.title 切换：当目标路由（或其 matched 链上任意父级）
 * 声明了 meta.title 时，更新为该标题；否则保留当前 title（通常为
 * 站点 systemName，由 [applyWebsiteBranding] 设置）。
 *
 * 与 mobile/router/router-guards.ts 对称实现，去掉 keepAlive 逻辑
 * （PC 端无 keepAlive 需求）。
 */
export function createPcRouterGuards(router: Router) {
  router.afterEach((to) => {
    // 设置每个页面的 title
    const title = to?.meta?.title as string | undefined
    if (title) {
      document.title = title
    }
  })
}
