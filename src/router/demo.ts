import { RouteRecordRaw } from 'vue-router'

const Layout = () => import('@/layout/index.vue')

/**
 * 演示模块路由
 */
export const DemoRoute: RouteRecordRaw = {
  path: '/',
  name: '',
  component: Layout,
  children: [
    {
      path: '/t',
      name: 'DispatchRouter',
      component: () => import('@/views/system/dispatch/DispatchRouter.vue'),
      meta: {
        title: '中转页',
        ignoreAuth: true,
        hiddenTabbar: true,
      },
    },
    {
      path: '/x/x/x',
      name: 'xx',
      component: () => import('@/views/modules/demo/xx.vue'),
      meta: {
        title: 'xx',
        hiddenTabbar: true,
        ignoreAuth: true,
      },
    },
  ],
}
