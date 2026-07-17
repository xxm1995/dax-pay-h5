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
  /**
   * 收银台入口（跨端；预下单落地 URL 契约，不可改）
   * Mobile：UA 探测后 replace 到 CASHIER_ENV
   * PC：直接 WEB 收银页
   */
  CASHIER: '/cashier/:orderNo',
  /**
   * 收银台环境页（Mobile H5；clientEnv=browser|wechat|alipay|union_pay|douyin）
   * 与运营端 H5 配置分桶一一对应；OAuth returnPath 指向此路径
   */
  CASHIER_ENV: '/cashier/:orderNo/:clientEnv',
  /**
   * 聚合扫码入口（跨端；预下单落地 URL 契约，不可改）
   * Mobile：UA 探测后 replace 到环境页；PC：单页处理
   */
  AGGREGATE: '/aggregate/:orderNo',
  /** 聚合-微信环境页（Mobile） */
  AGGREGATE_WECHAT: '/aggregate/wechat/:orderNo',
  /** 聚合-支付宝环境页（Mobile） */
  AGGREGATE_ALIPAY: '/aggregate/alipay/:orderNo',
  /** 聚合-云闪付环境页（Mobile） */
  AGGREGATE_UNION: '/aggregate/union-pay/:orderNo',
  /** 聚合-抖音环境页（Mobile） */
  AGGREGATE_DOUYIN: '/aggregate/douyin/:orderNo',
  /** 聚合-不支持的宿主环境提示（Mobile） */
  AGGREGATE_UNSUPPORTED: '/aggregate/unsupported',
  /** 码牌支付入口（跨端：Mobile 分发/收款，PC 扫码引导；path 与后端 getCodeLink /h/{code} 一致） */
  CODE_PAY: '/h/:code',
  /** 码牌支付-微信端（Mobile 收款；PC 同入口扫码引导） */
  CODE_PAY_WECHAT: '/h/wechat/:code',
  /** 码牌支付-支付宝端（Mobile 收款；PC 同入口扫码引导） */
  CODE_PAY_ALIPAY: '/h/alipay/:code',
  /** 码牌支付-云闪付端（Mobile 收款；PC 同入口扫码引导） */
  CODE_PAY_UNION: '/h/union-pay/:code',
  /** 码牌支付-抖音端（Mobile 收款；PC 同入口扫码引导） */
  CODE_PAY_DOUYIN: '/h/douyin/:code',
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
