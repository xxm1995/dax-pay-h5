import type { RouteRecordRaw } from 'vue-router'

const Layout = () => import('@/mobile/layout/index.vue')

// 业务路由模块（等待业务开发，当前仅保留占位首页）
const routeModuleList: Array<RouteRecordRaw> = [
  // 首页（根路径 /，与 PC 端首页地址统一）
  {
    path: '/',
    name: 'Home',
    component: Layout,
    meta: {
      title: '首页',
      icon: 'i-ph:house',
    },
    children: [
      {
        path: '',
        name: 'HomePage',
        meta: {
          keepAlive: true,
        },
        component: () => import('@/mobile/views/home/index.vue'),
      },
    ],
  },
]

export default routeModuleList
