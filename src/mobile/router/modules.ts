import type { RouteRecordRaw } from 'vue-router'
import { RoutePath } from '@/shared/router/paths'

const Layout = () => import('@/mobile/layout/index.vue')

// 业务路由模块
const routeModuleList: Array<RouteRecordRaw> = [
  // 首页（根路径 /，与 PC 端首页地址统一）
  {
    path: RoutePath.HOME,
    name: 'Home',
    component: Layout,
    meta: {
      title: '首页',
    },
    children: [
      {
        path: '',
        name: 'HomePage',
        meta: {
          keepAlive: true,
        },
        component: () => import('@/mobile/views/home/index.vue'),
      },
    ],
  },
  // 收银台（跨端：与 PC 端同 path 各指各 view）
  {
    path: RoutePath.CASHIER,
    name: 'Cashier',
    component: Layout,
    meta: {
      title: '收银台',
    },
    children: [
      {
        path: '',
        name: 'CashierPage',
        meta: {
          keepAlive: true,
        },
        component: () => import('@/mobile/views/cashier/index.vue'),
      },
    ],
  },
  // 码牌支付（移动独占：PC 端由注册表派生 device-only 存根）
  {
    path: RoutePath.CODE_PAY,
    name: 'CodePay',
    component: Layout,
    meta: {
      title: '码牌支付',
    },
    children: [
      {
        path: '',
        name: 'CodePayPage',
        component: () => import('@/mobile/views/code-pay/index.vue'),
      },
    ],
  },
  // 协议展示页（跨端：与 PC 端同 path 各指各 view，链接可独立分享）
  {
    path: RoutePath.PROTOCOL,
    name: 'Protocol',
    component: Layout,
    meta: {
      title: '协议',
    },
    children: [
      {
        path: '',
        name: 'ProtocolPage',
        component: () => import('@/mobile/views/protocol/index.vue'),
      },
    ],
  },
  // 支付宝认证落地页（移动独占：支付宝 App 内 JSAPI 取码）
  {
    path: RoutePath.AUTH_ALIPAY,
    name: 'AlipayAuth',
    component: () => import('@/mobile/views/auth/alipay/index.vue'),
    meta: {
      title: '支付宝认证',
    },
  },
  // 支付宝代运营授权落地页（移动独占：授权回跳换 app_auth_token）
  {
    path: RoutePath.ISV_AUTH_ALIPAY,
    name: 'AlipayIsvAuth',
    component: () => import('@/mobile/views/isv-auth/alipay/index.vue'),
    meta: {
      title: '支付宝代运营授权',
    },
  },
  // 微信认证落地页（跨端：与 PC 端同 path 各指各 view，微信公众号 OAuth 重定向回调取 code）
  {
    path: RoutePath.AUTH_WECHAT,
    name: 'WechatAuth',
    component: () => import('@/mobile/views/auth/wechat/index.vue'),
    meta: {
      title: '微信认证',
    },
  },
]

export default routeModuleList
