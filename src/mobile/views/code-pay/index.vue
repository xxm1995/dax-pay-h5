<script lang="ts" setup>
/**
 * 码牌支付入口分发页
 *
 * 二维码恒为 /h/:code; 按 UA replace 到微信/支付宝/云闪付/抖音端页,
 * 其它环境（browser 等）提示用钱包扫码。
 * 不支持页：四钱包图标 + 加粗标题 + 小号副文案（与聚合 unsupported 一致）。
 */
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import alipaySvg from '@/shared/assets/icons/channel/alipay.svg'
import douyinSvg from '@/shared/assets/icons/channel/douyin.svg'
import unionPaySvg from '@/shared/assets/icons/channel/union_pay.svg'
import wechatSvg from '@/shared/assets/icons/channel/wechat.svg'
import { detectClientEnv } from '@/shared/utils/client-env'

defineOptions({ name: 'CodePayDispatch' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const code = route.params.code as string

const unsupported = ref(false)
const redirecting = ref(true)

/** 四钱包图标（仅图标、无标签，与聚合 unsupported 一致） */
const walletIcons = [
  { src: wechatSvg, altKey: 'codePay.wallet.wechat' },
  { src: alipaySvg, altKey: 'codePay.wallet.alipay' },
  { src: unionPaySvg, altKey: 'codePay.wallet.union' },
  { src: douyinSvg, altKey: 'codePay.wallet.douyin' },
]

/** clientEnv → 码牌分端路由 name */
const ENV_ROUTE_NAME: Record<string, string> = {
  wechat: 'CodePayWechat',
  alipay: 'CodePayAlipay',
  union_pay: 'CodePayUnion',
  douyin: 'CodePayDouyin',
}

onMounted(() => {
  const env = detectClientEnv()
  const routeName = ENV_ROUTE_NAME[env]
  if (routeName) {
    router.replace({ name: routeName, params: { code } })
    return
  }
  // browser 等非钱包宿主: 提示用钱包扫码
  redirecting.value = false
  unsupported.value = true
})
</script>

<template>
  <div class="code-pay-dispatch">
    <!-- 跳转中 -->
    <template v-if="redirecting">
      <div class="code-pay-dispatch__brand" />
      <div class="code-pay-dispatch__panel">
        <van-loading color="#5d9dfe" size="28px" />
        <p class="code-pay-dispatch__tip">
          {{ t('codePay.redirecting') }}
        </p>
      </div>
    </template>

    <!-- 非微信/支付宝宿主：文案结构与聚合 unsupported 一致 -->
    <template v-else-if="unsupported">
      <div class="code-pay-dispatch__brand" />
      <div class="code-pay-dispatch__panel">
        <div class="code-pay-dispatch__wallets">
          <img
            v-for="item in walletIcons"
            :key="item.altKey"
            class="code-pay-dispatch__wallet-img"
            :src="item.src"
            :alt="t(item.altKey)"
            width="40"
            height="40"
          >
        </div>
        <!-- 请使用钱包扫码（加粗主标题，与聚合共用 key） -->
        <h1 class="code-pay-dispatch__title">
          {{ t('aggregate.unsupportedTitle') }}
        </h1>
        <!-- 请使用微信、支付宝、云闪付或抖音扫描二维码完成支付 -->
        <p class="code-pay-dispatch__desc">
          {{ t('aggregate.unsupportedDesc') }}
        </p>
        <p v-if="code" class="code-pay-dispatch__code">
          {{ t('codePay.codeLabel') }} {{ code }}
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped lang="less">
.code-pay-dispatch {
  min-height: 100%;
  min-height: 100dvh;
  padding-bottom: 40px;
  background: #f5f7fa;
  box-sizing: border-box;

  &__brand {
    height: 120px;
    background: linear-gradient(135deg, #5d9dfe, #4787f7);
  }

  &__panel {
    margin: -48px 16px 0;
    padding: 28px 20px 24px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgb(0 0 0 / 6%);
    text-align: center;
    box-sizing: border-box;
  }

  &__tip {
    margin: 16px 0 0;
    font-size: 14px;
    color: #909399;
  }

  &__wallets {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 18px;
  }

  &__wallet-img {
    display: block;
    width: 40px;
    height: 40px;
    object-fit: contain;
    border-radius: 10px;
  }

  // 与聚合 agg-unsup__title / __desc 一致
  &__title {
    margin: 0 0 8px;
    font-size: 17px;
    font-weight: 600;
    color: #303133;
    line-height: 1.4;
  }

  &__desc {
    margin: 0;
    font-size: 13px;
    color: #909399;
    line-height: 1.65;
    padding: 0 4px;
  }

  &__code {
    margin: 16px 0 0;
    font-size: 12px;
    color: #c0c4cc;
    word-break: break-all;
    line-height: 1.5;
  }
}
</style>
