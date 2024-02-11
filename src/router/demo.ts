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
      path: '/aggregate/alipay',
      name: 'AliPayAggregate',
      component: () => import('@/views/demo/aggregate/AliPayAggregate.vue'),
      meta: {
        title: '支付宝聚合支付',
      },
    },
    {
      path: '/aggregate/wechatPay',
      name: 'WechatPayAggregate',
      component: () => import('@/views/demo/aggregate/WechatPayAggregate.vue'),
      meta: {
        title: '微信聚合支付',
      },
    },
    {
      path: '/cashier/uniCashier',
      name: 'UniCashier',
      component: () => import('@/views/demo/cashier/UniCashier.vue'),
      meta: {
        title: '手机收银台',
      },
    },
  ],
}
