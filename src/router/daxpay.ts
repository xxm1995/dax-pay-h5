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
      component: () => import('@/views/daxpay/channel/alipay/auth/AlipayAuth.vue'),
      meta: {
        title: '支付宝信息获取',
      },
    },
    {
      path: '/wechat/auth/:appId/:channel/:queryCode',
      name: 'WechatAuth',
      component: () => import('@/views/daxpay/channel/wechat/auth/WechatAuth.vue'),
      meta: {
        title: '微信信息获取',
      },
    },
    {
      path: '/channel/cashier/:appId/:channel',
      name: 'ChannelCashier',
      component: () => import('@/views/daxpay/channel/ChannelCashier.vue'),
      meta: {
        title: '收银台',
      },
    },
    {
      path: '/alipay/cashier/:mchNo/:appId',
      name: 'AlipayCashier',
      component: () => import('@/views/daxpay/channel/alipay/cashier/AlipayCashier.vue'),
      meta: {
        title: '支付宝收银台',
      },
    },
    {
      path: '/wechat/cashier/:mchNo/:appId',
      name: 'WechatCashier',
      component: () => import('@/views/daxpay/channel/wechat/cashier/WechatCashier.vue'),
      meta: {
        title: '微信收银台',
      },
    },
  ],
}
