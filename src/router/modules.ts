import type { RouteRecordRaw } from 'vue-router'

const Layout = () => import('@/layout/index.vue')

// 业务路由模块（等待业务开发，当前仅保留占位首页）
const routeModuleList: Array<RouteRecordRaw> = [
  {
    path: '/home',
    name: 'Home',
    redirect: '/home/index',
    component: Layout,
    meta: {
      title: '首页',
      icon: 'i-ph:house',
    },
    children: [
      {
        path: 'index',
        name: 'HomePage',
        meta: {
          keepAlive: true,
        },
        component: () => import('@/views/home/index.vue'),
      },
    ],
  },
]

export default routeModuleList
