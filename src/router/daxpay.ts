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
      component: () => import('@/views/daxpay/channel/alipay/AlipayAuthCallback.vue'),
      meta: {
        title: '支付宝信息获取',
      },
    },
    {
      path: '/wechat/auth/:appId/:channel/:queryCode',
      name: 'WechatAuth',
      component: () => import('@/views/daxpay/channel/wechat/WechatAuthCallback.vue'),
      meta: {
        title: '微信信息获取',
      },
    },
  ],
}
