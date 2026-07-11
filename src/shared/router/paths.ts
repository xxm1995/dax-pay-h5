/**
 * 业务路由 path 常量
 *
 * 两端路由（mobile/pc）注册路由时必须从此引用，杜绝 path 字面量漂移。
 * 跨端页（两端都实现）尤其关键：必须用同一常量保证 path 形态完全一致。
 *
 * 注意：本常量仅用于路由注册（route record 的 path 字段）。
 * 导航时请用 router.push({ name, params })，不要手工拼接 path 字符串。
 *
 * 新增业务页示例（按需取消注释并配合对应 view）：
 *   跨端页（如收银台）：  CASHIER: '/cashier/:id',
 *   PC 独占（如商户后台）：MERCHANT_DASHBOARD: '/merchant/dashboard',
 *   移动独占（如微信绑定）：WECHAT_BIND: '/wechat/bind',
 */
export const RoutePath = {
  /** 首页（跨端） */
  HOME: '/',
  /** 收银台（跨端：两端各实现，同 path 各指各 view） */
  CASHIER: '/cashier/:orderNo',
  /** 聚合扫码支付（跨端：两端各实现） */
  AGGREGATE: '/aggregate/:orderNo',
  /** 码牌支付（移动独占） */
  CODE_PAY: '/code-pay/:code',
  /** 商户对账单（PC 独占） */
  MERCHANT_STATEMENT: '/merchant/statement',
  /** 协议展示页（跨端：用户协议/隐私政策，链接可独立分享） */
  PROTOCOL: '/protocol/:protocolType',
  /** 支付宝认证落地页（移动独占：OAuth 重定向回调，authToken 通过 state 查询参数传递） */
  AUTH_ALIPAY: '/auth/alipay',
  /** 支付宝代运营授权落地页（移动独占：支付宝授权回跳换 app_auth_token） */
  ISV_AUTH_ALIPAY: '/isv-auth/alipay',
  /** 微信认证落地页（跨端：公众号 OAuth 重定向回调，PC 微信内置浏览器也可访问，authToken 通过 state 查询参数传递） */
  AUTH_WECHAT: '/auth/wechat',
  /** 抖音认证落地页（移动独占：抖音 silent_auth 重定向回调，authToken 通过 state 查询参数传递） */
  AUTH_DOUYIN: '/auth/douyin',
} as const
