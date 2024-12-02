/**
 * 支付通道
 */
export enum ChannelEnum {
  ALI = 'ali_pay',
  WECHAT = 'wechat_pay',
  UNION_PAY = 'union_pay',
}

/**
 * 支付方式
 */
export enum payMethodEnum {
  WAP = 'wap',
  APP = 'app',
  WEB = 'web',
  QRCODE = 'qrcode',
  BARCODE = 'barcode',
  JSAPI = 'jsapi',
}

/**
 * 收银台类型
 */
export enum CashierTypeEnum {
  WECHAT_PAY = 'wechat_pay',
  ALIPAY = 'alipay',
}

/**
 * 聚合支付方式
 */
export enum AggregateTypeEnum {
  WECHAT = 'wechat',
  ALIPAY = 'alipay',
}
