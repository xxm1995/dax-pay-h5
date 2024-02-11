import { RouteRecordRaw } from 'vue-router'

const Layout = () => import('@/layout/index.vue')

/**
 * 业务模块路由
 */
export const BusinessRoute: RouteRecordRaw = {
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
      path: '/result/success',
      name: 'PaySuccessResult',
      component: () => import('@/views/result/PaySuccessResult.vue'),
      meta: {
        title: '支付成功',
      },
    },
    {
      path: '/result/error',
      name: 'PayErrorResult',
      component: () => import('@/views/result/PayErrorResult.vue'),
      meta: {
        title: '支付失败',
      },
    },
  ],
}
