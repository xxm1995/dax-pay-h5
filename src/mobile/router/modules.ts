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
  // 收银台：入口 /cashier/:orderNo → 环境页 /cashier/:orderNo/:clientEnv
  {
    path: RoutePath.CASHIER,
    name: 'Cashier',
    component: Layout,
    meta: {
      title: '收银台',
    },
    children: [
      {
        // 入口：UA 探测后 replace 到环境页
        path: '',
        name: 'CashierEntry',
        component: () => import('@/mobile/views/cashier/entry.vue'),
      },
      {
        // 环境页：clientEnv 白名单在页内校验（不缓存：收银台为一次性支付页，每次须重新探测与加载）
        path: ':clientEnv',
        name: 'CashierEnvPage',
        component: () => import('@/mobile/views/cashier/CashierEnvPage.vue'),
      },
    ],
  },
  // 聚合扫码：环境页须先于入口注册（避免 wechat 等被 :orderNo 吞掉）
  {
    path: RoutePath.AGGREGATE_WECHAT,
    name: 'AggregateWechat',
    component: Layout,
    meta: { title: '聚合支付' },
    children: [
      {
        path: '',
        name: 'AggregateWechatPage',
        component: () => import('@/mobile/views/aggregate/wechat/Index.vue'),
      },
    ],
  },
  {
    path: RoutePath.AGGREGATE_ALIPAY,
    name: 'AggregateAlipay',
    component: Layout,
    meta: { title: '聚合支付' },
    children: [
      {
        path: '',
        name: 'AggregateAlipayPage',
        component: () => import('@/mobile/views/aggregate/alipay/Index.vue'),
      },
    ],
  },
  {
    path: RoutePath.AGGREGATE_UNION,
    name: 'AggregateUnion',
    component: Layout,
    meta: { title: '聚合支付' },
    children: [
      {
        path: '',
        name: 'AggregateUnionPage',
        component: () => import('@/mobile/views/aggregate/union-pay/Index.vue'),
      },
    ],
  },
  {
    path: RoutePath.AGGREGATE_DOUYIN,
    name: 'AggregateDouyin',
    component: Layout,
    meta: { title: '聚合支付' },
    children: [
      {
        path: '',
        name: 'AggregateDouyinPage',
        component: () => import('@/mobile/views/aggregate/douyin/Index.vue'),
      },
    ],
  },
  {
    path: RoutePath.AGGREGATE_UNSUPPORTED,
    name: 'AggregateUnsupported',
    component: Layout,
    meta: { title: '聚合支付' },
    children: [
      {
        path: '',
        name: 'AggregateUnsupportedPage',
        component: () => import('@/mobile/views/aggregate/unsupported.vue'),
      },
    ],
  },
  // 聚合扫码入口（预下单落地 URL 契约 /aggregate/:orderNo）
  {
    path: RoutePath.AGGREGATE,
    name: 'Aggregate',
    component: Layout,
    meta: {
      title: '聚合支付',
    },
    children: [
      {
        path: '',
        name: 'AggregateEntry',
        component: () => import('@/mobile/views/aggregate/Entry.vue'),
      },
    ],
  },
  // 码牌支付-微信端（静态段须在 /h/:code 之前注册）
  {
    path: RoutePath.CODE_PAY_WECHAT,
    name: 'CodePayWechat',
    component: Layout,
    meta: {
      title: '码牌支付',
    },
    children: [
      {
        path: '',
        name: 'CodePayWechatPage',
        component: () => import('@/mobile/views/code-pay/wechat/index.vue'),
      },
    ],
  },
  // 码牌支付-支付宝端
  {
    path: RoutePath.CODE_PAY_ALIPAY,
    name: 'CodePayAlipay',
    component: Layout,
    meta: {
      title: '码牌支付',
    },
    children: [
      {
        path: '',
        name: 'CodePayAlipayPage',
        component: () => import('@/mobile/views/code-pay/alipay/index.vue'),
      },
    ],
  },
  // 码牌支付-云闪付端（静态段须在 /h/:code 之前注册）
  {
    path: RoutePath.CODE_PAY_UNION,
    name: 'CodePayUnion',
    component: Layout,
    meta: {
      title: '码牌支付',
    },
    children: [
      {
        path: '',
        name: 'CodePayUnionPage',
        component: () => import('@/mobile/views/code-pay/union-pay/index.vue'),
      },
    ],
  },
  // 码牌支付-抖音端
  {
    path: RoutePath.CODE_PAY_DOUYIN,
    name: 'CodePayDouyin',
    component: Layout,
    meta: {
      title: '码牌支付',
    },
    children: [
      {
        path: '',
        name: 'CodePayDouyinPage',
        component: () => import('@/mobile/views/code-pay/douyin/index.vue'),
      },
    ],
  },
  // 码牌支付入口分发（跨端：PC 为扫码引导页）
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
  // 支付宝认证落地页（移动独占：支付宝 OAuth 重定向回调）
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
  // 抖音认证落地页（移动独占：抖音 silent_auth 重定向回调取 code）
  {
    path: RoutePath.AUTH_DOUYIN,
    name: 'DouyinAuth',
    component: () => import('@/mobile/views/auth/douyin/index.vue'),
    meta: {
      title: '抖音认证',
    },
  },
]

export default routeModuleList
