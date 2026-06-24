import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { otherDeviceExclusives } from '@/shared/router/exclusive'
import { RoutePath } from '@/shared/router/paths'

// 移动独占路径：在 PC 端渲染"仅限手机端"提示存根（由注册表派生，勿手写）
const mobileOnlyStubs: RouteRecordRaw[] = otherDeviceExclusives('pc').map(r => ({
  path: r.path,
  name: `${r.name}__stub`,
  component: () => import('@/pc/views/device-only.vue'),
}))

// PC 端路由树（独立于移动端，按需在此扩展业务路由，例如收银台 PC 版）
// 顺序：真实路由 → 移动独占提示存根 → catch-all 404
const routes: RouteRecordRaw[] = [
  {
    path: RoutePath.HOME,
    name: 'PcHome',
    component: () => import('@/pc/views/Home.vue'),
  },
  // 收银台（跨端：与移动端同 path 各指各 view）
  {
    path: RoutePath.CASHIER,
    name: 'PcCashier',
    component: () => import('@/pc/views/cashier/Index.vue'),
    meta: { title: '收银台' },
  },
  // 商户对账单（PC 独占：移动端由注册表派生 device-only 存根）
  {
    path: RoutePath.MERCHANT_STATEMENT,
    name: 'MerchantStatement',
    component: () => import('@/pc/views/statement/Index.vue'),
    meta: { title: '商户对账单' },
  },
  ...mobileOnlyStubs,
  // 兜底：移动端专属路径（如 /home/index）或任何未匹配路径，渲染 PC 404 页
  // 用 component 而非 redirect——vue-router 5 下 catch-all + redirect 在初始导航不触发
  {
    path: '/:pathMatch(.*)*',
    name: 'PcNotFound',
    component: () => import('@/pc/views/NotFound.vue'),
  },
]

const pcRouter = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ left: 0, top: 0 }),
})

export function setupPCRouter(app: App) {
  app.use(pcRouter)
}

export { pcRouter }
