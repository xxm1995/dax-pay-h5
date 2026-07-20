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
  // 聚合扫码：入口 + 非宿主提示 + 各宿主环境页 统一在 Aggregate 父级下作为子路由
  // 让 App.vue 顶层 transition key（matched[0].name）在 entry → 环境页跳转时保持不变（都是 Aggregate），
  // 避免整页 remount 与 Entry.vue 的 onBeforeMount router.replace 竞争导致白屏
  // （曾发生在支付宝 webview：onBeforeMount 跨顶层 replace 与 <transition mode="out-in" appear> 的 enter 死锁）
  // 注意：静态段（unsupported/alipay/wechat/union-pay/douyin）必须排在 :orderNo 之前，否则会被当订单号吞掉
  // URL 契约不变，仍是 /aggregate/:orderNo、/aggregate/unsupported、/aggregate/{env}/:orderNo
  {
    path: RoutePath.AGGREGATE_GROUP,
    name: 'Aggregate',
    component: Layout,
    children: [
      // 非宿主提示：静态 path 段
      {
        path: 'unsupported',
        name: 'AggregateUnsupportedPage',
        component: () => import('@/mobile/views/aggregate/unsupported.vue'),
      },
      // 微信环境页
      {
        path: 'wechat/:orderNo',
        name: 'AggregateWechatPage',
        component: () => import('@/mobile/views/aggregate/wechat/Index.vue'),
      },
      // 支付宝环境页
      {
        path: 'alipay/:orderNo',
        name: 'AggregateAlipayPage',
        component: () => import('@/mobile/views/aggregate/alipay/Index.vue'),
      },
      // 云闪付环境页
      {
        path: 'union-pay/:orderNo',
        name: 'AggregateUnionPage',
        component: () => import('@/mobile/views/aggregate/union-pay/Index.vue'),
      },
      // 抖音环境页
      {
        path: 'douyin/:orderNo',
        name: 'AggregateDouyinPage',
        component: () => import('@/mobile/views/aggregate/douyin/Index.vue'),
      },
      // 入口：UA 探测后 replace 到环境页（静态段已注册完毕，:orderNo 兜底匹配订单号）
      {
        path: ':orderNo',
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
