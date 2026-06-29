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
]

export default routeModuleList
