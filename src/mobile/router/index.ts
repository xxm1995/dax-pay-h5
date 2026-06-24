import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { useRouteStoreWithOut } from '@/shared/store/modules/route'
import { ErrorPageRoute } from './base'
import routeModuleList from './modules'
import { createRouterGuards } from './router-guards'

// 普通路由
export const constantRouter: RouteRecordRaw[] = [ErrorPageRoute]

const routeStore = useRouteStoreWithOut()

routeStore.setMenus(routeModuleList)
routeStore.setRouters(constantRouter.concat(routeModuleList))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: constantRouter.concat(...routeModuleList),
  strict: true,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

export function setupRouter(app: App) {
  app.use(router)
  // 创建路由守卫
  createRouterGuards(router)
}

export default router
