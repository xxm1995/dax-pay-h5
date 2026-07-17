<script lang="ts" setup>
/**
 * 码牌支付入口分发页
 *
 * 二维码恒为 /h/:code; 按 UA replace 到微信/支付宝端页, 其它环境提示用钱包扫码。
 */
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { detectClientEnv } from '@/shared/utils/client-env'

defineOptions({ name: 'CodePayDispatch' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const code = route.params.code as string

const unsupported = ref(false)
const redirecting = ref(true)

onMounted(() => {
  const env = detectClientEnv()
  if (env === 'wechat') {
    router.replace({ name: 'CodePayWechat', params: { code } })
    return
  }
  if (env === 'alipay') {
    router.replace({ name: 'CodePayAlipay', params: { code } })
    return
  }
  // 云闪付/抖音/浏览器: 本期提示用微信或支付宝扫码
  redirecting.value = false
  unsupported.value = true
})
</script>

<template>
  <div class="code-pay-dispatch">
    <div v-if="redirecting" class="code-pay-dispatch__box">
      <van-loading color="#5d9dfe" size="28px" />
      <p>{{ t('codePay.redirecting') }}</p>
    </div>
    <div v-else-if="unsupported" class="code-pay-dispatch__box">
      <svg viewBox="0 0 1024 1024" width="48" height="48" aria-hidden="true">
        <path fill="#ee0a24" d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm32 664c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V456c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v272zm-32-344a48.01 48.01 0 0 1 0-96 48.01 48.01 0 0 1 0 96z" />
      </svg>
      <p class="code-pay-dispatch__title">
        {{ t('codePay.unsupportedClient') }}
      </p>
      <p class="code-pay-dispatch__hint">
        {{ t('codePay.unsupportedClientHint') }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="less">
.code-pay-dispatch {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 24px;

  &__box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
    color: #666;
    font-size: 14px;
    max-width: 320px;
  }

  &__title {
    margin: 8px 0 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }

  &__hint {
    margin: 0;
    color: #999;
    line-height: 1.5;
  }
}
</style>
