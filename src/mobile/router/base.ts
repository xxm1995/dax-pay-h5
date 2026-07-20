import type { RouteRecordRaw } from 'vue-router'

const Layout = () => import('@/mobile/layout/index.vue')

// 404 on a page
export const ErrorPageRoute: RouteRecordRaw = {
  path: '/:path(.*)*',
  name: 'ErrorPage',
  component: Layout,
  meta: {
    title: 'route.errorPage', // 页面不存在
    hideBreadcrumb: true,
  },
  children: [
    {
      path: '/:path(.*)*',
      name: 'ErrorPageSon',
      component: () => import('@/mobile/views/exception/404.vue'),
      meta: {
        title: 'route.errorPage', // 页面不存在
        hideBreadcrumb: true,
      },
    },
  ],
}
