<template>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { WxJsapiSignResult } from '@/views/demo/aggregate/Aggregate.api'
import type { CashierAuthCodeParam } from '@/views/daxpay/channel/ChannelCashier.api'

const route = useRoute()
const { mchNo, appId } = route.params
const { code } = route.query

const loading = ref<boolean>(false)
const amount = ref<number>(0.0)

// 认证参数
const authParam = ref<CashierAuthCodeParam>({
  mchNo: mchNo as string,
  appId: appId as string,
  authCode: code as string,
  cashierType: 'wechat_pay',
})

onMounted(() => {
  init()
})

/**
 * 初始化
 */
function init() {
  // 如果不是重定向跳转过来， 跳转到到重定向地址
  if (!code) {
    // 跳转到微信授权地址
    const url = ''
    location.replace(url)
  }
  else {
    // 获取并设置OpenId

    // 发起收银台支付

    // 获取jsapi调用方式
    doJsapiPay()
  }
}

/**
 * 微信jsapi方式支付
 */
function wechatPay() {
  loading.value = true
  const from = {
    bizOrderNo: `M${new Date().getTime()}`,
    title: '测试H5支付',
    amount: amount.value,
    channel: ChannelEnum.WECHAT,
    method: MethodEnum.JSAPI,
    openId: openId.value,
  }
  simplePayCashier(from)
    .then(({ data }) => {
      loading.value = false
      // 拉起jsapi支付
      const json = JSON.parse(data.payBody)
      doJsapiPay(json)
    })
    .catch((err) => {
      // 跳转到错误页
      router.push({
        name: 'ErrorResult',
        query: { msg: err.message },
      })
    })
}

/**
 * 拉起Jsapi支付窗口
 */
function doJsapiPay(data: WxJsapiSignResult) {
  const form = {
    appId: data.appId, // 公众号ID，由商户传入
    timeStamp: data.timeStamp, // 时间戳，自1970年以来的秒数
    nonceStr: data.nonceStr, // 随机串
    package: data.package, // 预支付ID
    signType: data.signType, // 微信签名方式：
    paySign: data.paySign, // 微信签名
  }
  // 使用微信JsSdk拉起支付
  WeixinJSBridge.invoke('getBrandWCPayRequest', form, () => {
    if (res.err_msg === 'get_brand_wcpay_request:ok') {
      // 跳转到成功页面
      setTimeout(() => {
        WeixinJSBridge.call('closeWindow')
      }, 0)
    }
  })
}
</script>

<style scoped lang="less">

</style>
