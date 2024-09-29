import type { RouteRecordRaw } from 'vue-router'
import { PageEnum } from '@/enums/pageEnum'

const Layout = () => import('@/layout/index.vue')

/**
 * 业务模块路由
 */
export const BusinessRoute: RouteRecordRaw = {
  path: '/',
  name: '',
  redirect: PageEnum.BASE_HOME,
  component: Layout,
  children: [
    {
      path: '/t/:key',
      name: 'DispatchRouter',
      component: () => import('@/views/system/dispatch/DispatchRouter.vue'),
      meta: {
        title: '中转页',
      },
    },
    {
      path: '/result/success',
      name: 'SuccessResult',
      component: () => import('@/views/result/SuccessResult.vue'),
      meta: {
        title: '操作成功',
      },
    },
    {
      path: '/result/error',
      name: 'ErrorResult',
      component: () => import('@/views/result/ErrorResult.vue'),
      meta: {
        title: '错误页',
      },
    },
  ],
}
