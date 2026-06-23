import type { RouteRecordRaw } from 'vue-router'

const Layout = () => import('@/layout/index.vue')

// 业务路由模块（等待业务开发，当前仅保留占位首页与主题设置页）
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
  // 主题设置页（内页，Dark Mode / 系统主题色 / 页面动画）
  {
    path: '/themeSetting',
    name: 'ThemeSetting',
    meta: {
      title: '主题设置',
      innerPage: true,
    },
    component: () => import('@/views/my/ThemeSetting.vue'),
  },
]

export default routeModuleList
