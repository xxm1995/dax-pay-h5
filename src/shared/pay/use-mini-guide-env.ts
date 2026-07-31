/**
 * 小程序入口引导页(/m/:code、/am/:orderNo、/cm/:orderNo)的 UA 感知文案与图标
 *
 * 钱包 App 内(微信/支付宝/云闪付/抖音)扫码本应由「普通链接二维码」规则拉起
 * cashier 小程序;若规则未配/未匹配/小程序未发布,会落到本 H5 引导页。此时再显示
 * "请用微信扫码"会自相矛盾(用户就在微信里),故按 UA 分流:
 * - 钱包内:展示"收款小程序暂不可用"提示,并仅高亮当前钱包图标(聚焦)
 * - 系统浏览器/PC:保持"请扫码支付"提示 + 钱包图标(收银台小程序仅微信)
 *
 * UA 一次扫描即定(同一会话不变),无需响应式。
 */
import type { AggregateClientEnv } from '@/shared/utils/client-env'
import alipaySvg from '@/shared/assets/icons/channel/alipay.svg'
import douyinSvg from '@/shared/assets/icons/channel/douyin.svg'
import unionPaySvg from '@/shared/assets/icons/channel/union_pay.svg'
import wechatSvg from '@/shared/assets/icons/channel/wechat.svg'
import {
  AGGREGATE_CLIENT_ENVS,
  detectClientEnv,
  isAggregateClientEnv,
} from '@/shared/utils/client-env'

/** 钱包图标项(alt 用 aggregate.clientEnv.* 统一翻译) */
export interface MiniGuideWalletIcon {
  src: string
  altKey: string
}

/** 宿主环境 → 钱包图标 */
const ENV_ICON_MAP: Record<AggregateClientEnv, MiniGuideWalletIcon> = {
  wechat: { src: wechatSvg, altKey: 'aggregate.clientEnv.wechat' },
  alipay: { src: alipaySvg, altKey: 'aggregate.clientEnv.alipay' },
  union_pay: { src: unionPaySvg, altKey: 'aggregate.clientEnv.union' },
  douyin: { src: douyinSvg, altKey: 'aggregate.clientEnv.douyin' },
}

export interface MiniGuideEnv {
  /** 是否在钱包 App 内(微信/支付宝/云闪付/抖音) */
  inWallet: boolean
  /** 图标列表:钱包内仅当前钱包(高亮聚焦);收银台小程序仅展示微信 */
  icons: MiniGuideWalletIcon[]
  /** 标题 i18n key */
  titleKey: string
  /** 描述 i18n key */
  descKey: string
}

/** 小程序映射入口所属业务 */
export type MiniGuideScope = 'aggregate' | 'cashier'

/**
 * 探测当前 UA,返回引导页所需的文案 key 与图标列表
 */
export function useMiniGuideEnv(scope: MiniGuideScope = 'aggregate'): MiniGuideEnv {
  const env = detectClientEnv()
  const inWallet = isAggregateClientEnv(env)
  // inWallet 为 true 时,env 已收窄为 AggregateClientEnv(type guard)
  const icons = scope === 'cashier'
    ? [ENV_ICON_MAP.wechat]
    : inWallet
      ? [ENV_ICON_MAP[env]]
      : AGGREGATE_CLIENT_ENVS.map(e => ENV_ICON_MAP[e])
  const messagePrefix = scope === 'cashier' ? 'cashier' : 'aggregate'
  return {
    inWallet,
    icons,
    // 钱包内:小程序未拉起专属文案;否则:通用扫码文案
    titleKey: inWallet ? `${messagePrefix}.miniInWalletTitle` : `${messagePrefix}.miniScanTitle`,
    descKey: inWallet ? `${messagePrefix}.miniInWalletDesc` : `${messagePrefix}.miniScanDesc`,
  }
}
