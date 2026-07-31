import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { otherDeviceExclusives } from '@/shared/router/exclusive'
import { useRouteStoreWithOut } from '@/shared/store/modules/route'
import { ErrorPageRoute } from './base'
import routeModuleList from './modules'
import { createRouterGuards } from './router-guards'

// 普通路由
export const constantRouter: RouteRecordRaw[] = [ErrorPageRoute]

const routeStore = useRouteStoreWithOut()

routeStore.setMenus(routeModuleList)
routeStore.setRouters(constantRouter.concat(routeModuleList))

// PC 独占路径：在移动端渲染"仅限电脑端"提示存根（由注册表派生，勿手写）
const pcOnlyStubs: RouteRecordRaw[] = otherDeviceExclusives('mobile').map(r => ({
  path: r.path,
  name: `${r.name}__stub`,
  component: () => import('@/mobile/views/DeviceOnly.vue'),
}))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // 顺序：业务路由 → PC 独占提示存根 → catch-all 404
  routes: [...routeModuleList, ...pcOnlyStubs, ErrorPageRoute],
  strict: true,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

export function setupRouter(app: App) {
  app.use(router)
  // 创建路由守卫
  createRouterGuards(router)
}

export default router
