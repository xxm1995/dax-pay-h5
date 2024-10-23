import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHashHistory, createWebHistory } from "vue-router";
import { createRouterGuards } from './router-guards'
import { ErrorPageRoute, routeModuleList } from '@/router/base'
import { useRouteStoreWidthOut } from '@/store/modules/route'

// 菜单
import { BusinessRoute } from '@/router/business'
import { DaxPayRoute } from '@/router/daxpay'

// 普通路由
export const constantRouter: RouteRecordRaw[] = [
  DaxPayRoute,
  ErrorPageRoute,
  BusinessRoute,
]

const routeStore = useRouteStoreWidthOut()

routeStore.setMenus(routeModuleList)
routeStore.setRouters(constantRouter.concat(routeModuleList))

const router = createRouter({
  // 重定向时hash模式有场景无法跳转，需要使用history模式
  history: createWebHistory(import.meta.env.VITE_PUBLIC_PATH),
  routes: constantRouter.concat(...routeModuleList),
  strict: true,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

export function setupRouter(app: App) {
  app.use(router)
  createRouterGuards(router)
}

export default router
