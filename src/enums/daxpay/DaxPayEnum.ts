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
export enum PayMethodEnum {
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
export enum CheckoutTypeEnum {
  H5 = 'h5',
  PC = 'pc',
  MINI_APP = 'mini_app',
  AGGREGATE = 'aggregate',
}

export enum AggregateEnum{
  ALI = 'ali',
  WECHAT = 'wechat_pay',
}

