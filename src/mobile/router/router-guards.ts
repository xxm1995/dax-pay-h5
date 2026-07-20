import type { RouteLocationNormalized, Router } from 'vue-router'
import NProgress from 'nprogress'
import { watch } from 'vue'
import { isNavigationFailure } from 'vue-router'
import i18n, { t } from '@/shared/locales'
import { useRouteStoreWithOut } from '@/shared/store/modules/route'
import {
  detectAggregateClientEnv,
  detectClientEnv,
} from '@/shared/utils/client-env'
import 'nprogress/nprogress.css'

NProgress.configure({ parent: '#app' })

/** 聚合 clientEnv → 路由 name（指向 Aggregate 父级下的环境页子路由） */
const AGGREGATE_ENV_ROUTE_NAME: Record<string, string> = {
  wechat: 'AggregateWechatPage',
  alipay: 'AggregateAlipayPage',
  union_pay: 'AggregateUnionPage',
  douyin: 'AggregateDouyinPage',
}

/** 码牌 clientEnv → 路由 name（指向 CodePay 父级下的环境页子路由，避免跨顶层触发 transition remount） */
const CODE_PAY_ENV_ROUTE_NAME: Record<string, string> = {
  wechat: 'CodePayWechatPage',
  alipay: 'CodePayAlipayPage',
  union_pay: 'CodePayUnionPage',
  douyin: 'CodePayDouyinPage',
}

/**
 * entry 探测：在导航阶段直接 replace 到目标环境页，
 * 避免 entry 组件 mount/unmount 带来的额外视觉切换（消除"闪一下"）
 *
 * 与 entry.vue 的 onBeforeMount replace 形成兜底：守卫拦截成功则 entry 组件不会挂载；
 * 守卫若因故未拦到（return true），entry.vue 仍会兜底执行同样的探测逻辑
 */
function resolveEntryRedirect(to: RouteLocationNormalized): RouteLocationNormalized | Record<string, unknown> | null {
  // 收银台入口 → 环境页（detectClientEnv 总有返回值，含 browser）
  if (to.name === 'CashierEntry') {
    const orderNo = to.params.orderNo as string
    if (orderNo) {
      const clientEnv = detectClientEnv()
      return { name: 'CashierEnvPage', params: { orderNo, clientEnv }, replace: true }
    }
  }
  // 聚合入口 → 各宿主环境页 / 非宿主提示页
  if (to.name === 'AggregateEntry') {
    const orderNo = to.params.orderNo as string
    if (orderNo) {
      const clientEnv = detectAggregateClientEnv()
      if (!clientEnv) {
        // 非宿主：提示页
        return { name: 'AggregateUnsupportedPage', query: { orderNo }, replace: true }
      }
      const routeName = AGGREGATE_ENV_ROUTE_NAME[clientEnv]
      if (routeName) {
        return { name: routeName, params: { orderNo }, replace: true }
      }
    }
  }
  // 码牌分发入口 → 各宿主端页（非钱包宿主留在 CodePayEntry 显示扫码提示）
  if (to.name === 'CodePayEntry') {
    const code = to.params.code as string
    if (code) {
      const env = detectClientEnv()
      const routeName = CODE_PAY_ENV_ROUTE_NAME[env]
      if (routeName) {
        return { name: routeName, params: { code }, replace: true }
      }
      // browser 等非钱包宿主：留在 CodePayEntry（onBeforeMount 显示"请用钱包扫码"）
    }
  }
  return null
}

/** 根据路由 meta.title（i18n key）设置浏览器标题 */
function applyRouteDocumentTitle(router: Router) {
  const key = router.currentRoute.value.meta?.title as string | undefined
  if (key) {
    // 路由页标题
    document.title = t(key)
  }
}

export function createRouterGuards(router: Router) {
  router.beforeEach((to) => {
    NProgress.start()
    // entry 探测：拦截入口路由，导航阶段直接 replace 到环境页
    const redirect = resolveEntryRedirect(to)
    if (redirect) {
      return redirect
    }
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
