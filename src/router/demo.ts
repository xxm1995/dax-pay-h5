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
      path: '/cashier/alipay',
      name: 'AlipayCashier',
      component: () => import('@/views/demo/cashier/AlipayCashier.vue'),
      meta: {
        title: '支付宝收银台',
      },
    },
    {
      path: '/cashier/wxJsapiPay',
      name: 'WechatJsapiPay',
      component: () => import('@/views/demo/cashier/WechatJsapiPay.vue'),
      meta: {
        title: '支付宝收银台',
      },
    },
    {
      path: '/exception/timeout',
      name: 'TimeoutPay',
      component: () => import('@/views/demo/exception/TimeoutPay.vue'),
      meta: {
        title: '支付超时',
      },
    },
    {
      path: '/exception/errorPay',
      name: 'TimeoutPay',
      component: () => import('@/views/demo/exception/ErrorPay.vue'),
      meta: {
        title: '支付超时',
      },
    },
  ],
}
