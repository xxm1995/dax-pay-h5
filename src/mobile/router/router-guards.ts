import type { Router } from 'vue-router'
import NProgress from 'nprogress'
import { watch } from 'vue'
import { isNavigationFailure } from 'vue-router'
import i18n, { t } from '@/shared/locales'
import { useRouteStoreWithOut } from '@/shared/store/modules/route'
import 'nprogress/nprogress.css'

NProgress.configure({ parent: '#app' })

/** 根据路由 meta.title（i18n key）设置浏览器标题 */
function applyRouteDocumentTitle(router: Router) {
  const key = router.currentRoute.value.meta?.title as string | undefined
  if (key) {
    // 路由页标题
    document.title = t(key)
  }
}

export function createRouterGuards(router: Router) {
  router.beforeEach(() => {
    NProgress.start()
    // 鉴权逻辑已移除：当前为开放式访问，待业务需要时在此补充登录/权限校验
    return true
  })

  // 进入某个路由之后触发的钩子
  router.afterEach((to, _, failure) => {
    // 设置每个页面的 title（meta.title 存 i18n key）
    const titleKey = to?.meta?.title as string | undefined
    if (titleKey) {
      document.title = t(titleKey)
    }

    if (isNavigationFailure(failure)) {
      console.warn('failed navigation', failure)
    }

    const routeStore = useRouteStoreWithOut()
    // 在这里设置需要缓存的组件名称
    const keepAliveComponents = routeStore.keepAliveComponents
    // 获取当前组件名
    const currentComName: any = to.matched.find(item => item.name === to.name)?.name

    // 如果 currentComName 且 keepAliveComponents 不包含 currentComName 且 即将要进入的路由 meta 属性里 keepAlive 为 true，则缓存该组件
    if (currentComName && !keepAliveComponents.includes(currentComName) && to.meta?.keepAlive) {
      // 需要缓存的组件
      keepAliveComponents.push(currentComName)
      // keepAlive 为 false 则不缓存
    }
    else if (!to.meta?.keepAlive) {
      // 不需要缓存的组件

      // 这里的作用一开始组件设置为缓存，之后又设置不缓存但是它还是存在 keepAliveComponents 数组中
      // keepAliveComponents 使用 findIndex 与 当前路由对比，如果存在则返回具体下标位置，不存在返回 -1
      const index = routeStore.keepAliveComponents.findIndex(name => name === currentComName)
      if (index !== -1) {
        // 通过返回具体下标位置删除 keepAliveComponents 数组中缓存的 元素
        keepAliveComponents.splice(index, 1)
      }
    }
    routeStore.setKeepAliveComponents(keepAliveComponents)
    NProgress.done()
  })

  // 切换语言时刷新当前页 document.title
  watch(
    () => i18n.global.locale.value,
    () => {
      applyRouteDocumentTitle(router)
    },
  )

  router.onError((error) => {
    console.error(error, '路由错误')
  })
}
