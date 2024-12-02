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
      path: '/alipay/auth/:appId/:channel/:queryCode/:aliAppId',
      name: 'AlipayAuth',
      component: () => import('@/views/daxpay/auth/alipay/AlipayAuth.vue'),
      meta: {
        title: '支付宝信息获取',
      },
    },
    {
      path: '/wechat/auth/:appId/:channel/:queryCode',
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
      name: 'ChannelCashier',
      component: () => import('@/views/daxpay/checkout/CheckoutPay.vue'),
      meta: {
        title: '结算台',
      },
    },
    {
      path: '/alipay/checkout/:appId/:orderNo',
      name: 'AlipayCashier',
      component: () => import('@/views/daxpay/checkout/alipay/AliAggregate.vue'),
      meta: {
        title: '支付宝结算台',
      },
    },
    {
      path: '/wechat/checkout/:appId/:orderNo',
      name: 'WechatCheckout',
      component: () => import('@/views/daxpay/checkout/wechat/WechatAggregate.vue'),
      meta: {
        title: '微信结算台',
      },
    },
  ],
}
