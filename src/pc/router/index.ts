import type { App } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

// PC 端路由树（独立于移动端，按需在此扩展业务路由，例如收银台 PC 版）
// 内页（收银台等）建议套 PcLayout；首页为全屏独立页，贴合移动端首页视觉
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'PcHome',
    component: () => import('@/pc/views/Home.vue'),
  },
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
