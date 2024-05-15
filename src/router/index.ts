import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createRouterGuards } from './router-guards'
import routeModuleList from './modules'
import { ErrorPageRoute, RootRoute } from '@/router/base'
import { useRouteStoreWidthOut } from '@/store/modules/route'

// 菜单
import { BusinessRoute } from '@/router/business'
import { DemoRoute } from '@/router/demo'

// 普通路由
export const constantRouter: RouteRecordRaw[] = [
  DemoRoute,
  RootRoute,
  ErrorPageRoute,
  BusinessRoute,
]

const routeStore = useRouteStoreWidthOut()

routeStore.setMenus(routeModuleList)
routeStore.setRouters(constantRouter.concat(routeModuleList))

const router = createRouter({
  history: createWebHashHistory(''),
  routes: constantRouter.concat(...routeModuleList),
  strict: true,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

export function setupRouter(app: App) {
  app.use(router)
  createRouterGuards(router)
}

export default router
