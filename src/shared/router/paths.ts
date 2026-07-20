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
  /**
   * 聚合扫码父级分组（仅 Mobile 路由注册用）
   * Mobile 把入口 + 非宿主提示 + 各宿主环境页（wechat/alipay/union-pay/douyin）全部
   * 合并到此父级下作为子路由，让 App.vue 顶层 transition key（matched[0].name）在
   * entry → 环境页跳转时保持不变（都是 Aggregate），避免整页 remount 与 Entry.vue 的
   * onBeforeMount router.replace 竞争导致白屏（曾发生在支付宝 webview）。
   * URL 契约不变：/aggregate/:orderNo、/aggregate/unsupported、/aggregate/{env}/:orderNo。
   * PC 仍用 AGGREGATE（/aggregate/:orderNo）作为单层路由。
   */
  AGGREGATE_GROUP: '/aggregate',
  /** 聚合-不支持的宿主环境提示（Mobile + PC 注册用） */
  AGGREGATE_UNSUPPORTED: '/aggregate/unsupported',
  /**
   * 码牌支付父级分组（仅 Mobile 路由注册用）
   * Mobile 把入口 + 各宿主环境页（wechat/alipay/union-pay/douyin）全部合并到此父级下作为
   * 子路由，让 App.vue 顶层 transition key（matched[0].name）在 entry → 环境页跳转时保持不变
   * （都是 CodePay），避免整页 remount 与 Entry 的 onBeforeMount router.replace 竞争导致白屏
   * （曾发生在支付宝 webview：跨顶层 replace 与 <transition mode="out-in" appear> 的 enter 死锁）。
   * URL 契约不变：/h/{code}、/h/{env}/{code}。
   * PC 仍用各 CODE_PAY_*（/h/:code、/h/wechat/:code 等）作为单层顶层路由。
   */
  CODE_PAY_GROUP: '/h',
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
