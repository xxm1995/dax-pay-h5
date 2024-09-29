<template>
  <div>
    <div class="container">
      <h2>收银台</h2>
      <div class="amount-display">
        <p>付款给骏易</p>
        <p class="amount">¥ 0</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type {
  CashierAuthCodeParam,
  CashierPayParam,
  WxJsapiSignResult,
} from '@/views/daxpay/channel/ChannelCashier.api'
import {
  cashierPay,
  generateAuthUrl,
} from '@/views/daxpay/channel/ChannelCashier.api'

import { CashierTypeEnum } from '@/enums/daxpay/DaxPayEnum'
import router from '@/router'

const route = useRoute()
const { mchNo, appId } = route.params
const { code } = route.query

const loading = ref<boolean>(false)
const amount = ref<number>(0.0)

// 认证参数
const authParam = ref<CashierAuthCodeParam>({
  mchNo: mchNo as string,
  appId: appId as string,
  cashierType: CashierTypeEnum.WECHAT_PAY,
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
    // 重定向跳转到微信授权地址
    generateAuthUrl(authParam.value).then((res) => {
      const url = res.data
      location.replace(url)
    })
  }
  else {
    // 发起收银台支付
    wechatPay()
  }
}

/**
 * 微信jsapi方式支付
 */
function wechatPay() {
  loading.value = true
  const from = {
    amount: amount.value,
    appId,
    authCode: code,
    cashierType: CashierTypeEnum.WECHAT_PAY,
    mchNo,
  } as CashierPayParam
  cashierPay(from)
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
      router.push({ name: 'SuccessResult', query: { msg: '支付成功' }, replace: true })
    }
  })
}
</script>

<style scoped lang="less">

</style>
