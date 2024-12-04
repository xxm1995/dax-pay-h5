import type { RouteRecordRaw } from 'vue-router'

const Layout = () => import('@/layout/index.vue')

/**
 * 支付模块路由
 */
export const DaxPayRoute: RouteRecordRaw = {
  path: '/daxpay',
  name: 'daxpay',
  component: Layout,
  children: [
    {
      path: '/auth/alipay/:appId/:channel/:queryCode/:aliAppId',
      name: 'AlipayAuth',
      component: () => import('@/views/daxpay/auth/alipay/AlipayAuth.vue'),
      meta: {
        title: '支付宝信息获取',
      },
    },
    {
      path: '/auth/wechat/:appId/:channel/:queryCode',
      name: 'WechatAuth',
      component: () => import('@/views/daxpay/auth/wechat/WechatAuth.vue'),
      meta: {
        title: '微信信息获取',
      },
    },
    {
      path: '/cashier/:code',
      name: 'CashierCode',
      component: () => import('@/views/daxpay/cashier/CashierCode.vue'),
      meta: {
        title: '收银台',
      },
    },
    {
      path: '/cashier/alipay/:code',
      name: 'AlipayCashierCode',
      component: () => import('@/views/daxpay/cashier/alipay/AlipayCashierCode.vue'),
      meta: {
        title: '支付宝收银台',
      },
    },
    {
      path: '/cashier/wechat/:code',
      name: 'WechatCashierCode',
      component: () => import('@/views/daxpay/cashier/wechat/WechatCashierCode.vue'),
      meta: {
        title: '微信收银台',
      },
    },
    {
      path: '/checkout/:orderNo',
      name: 'CheckoutPay',
      component: () => import('@/views/daxpay/checkout/CheckoutPay.vue'),
      meta: {
        title: '手机收银台',
      },
    },
    {
      path: '/aggregate/:orderNo',
      name: 'CheckAggregate',
      component: () => import('@/views/daxpay/checkout/CheckAggregate.vue'),
      meta: {
        title: '手机收银台',
      },
    },
    {
      path: '/aggregate/alipay/:orderNo',
      name: 'AliCheckout',
      component: () => import('@/views/daxpay/checkout/alipay/AliAggregate.vue'),
      meta: {
        title: '支付宝收银台',
      },
    },
    {
      path: '/aggregate/wechat/:orderNo',
      name: 'WechatCheckout',
      component: () => import('@/views/daxpay/checkout/wechat/WechatAggregate.vue'),
      meta: {
        title: '微信结算台',
      },
    },
  ],
}
