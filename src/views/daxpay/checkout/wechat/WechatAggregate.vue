<template>
  <div v-if="show">
    <div class="container">
      <div style="font-size: 28px;margin-top: 10px;">
        {{ aggregateInfo.config.name || '微信收银台' }}
      </div>
      <div class="amount-display">
        <p style="font-size: 20px">
          金额
        </p>
        <p style="font-size: 32px;">
          ¥ {{ aggregateInfo.order.amount || 0.00 }}
        </p>
      </div>
    </div>
    <van-submit-bar :price="(aggregateInfo.order.amount || 0)*100" button-text="支付" @submit="pay" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { CheckoutAggregateEnum } from '@/enums/daxpay/DaxPayEnum'
import router from '@/router'
import {
  AggregateOrderAndConfigResult, aggregatePay, CheckoutAggregatePayParam,
  CheckoutAuthCodeParam,
  CheckoutPayParam,
} from '@/views/daxpay/checkout/CheckoutPay.api'
import { auth, checkoutPay, generateAuthUrl, getAggregateConfig } from '@/views/daxpay/checkout/CheckoutPay.api'

import type { WxJsapiSignResult } from '@/views/daxpay/cashier/CashierCode.api'

const route = useRoute()
const { orderNo } = route.params
const { code: authCode } = route.query

const show = ref<boolean>(false)
const loading = ref<boolean>(false)

const openId = ref<string>('')

// 认证参数
const authParam = ref<CheckoutAuthCodeParam>({
  orderNo: orderNo as string,
  aggregateType: CheckoutAggregateEnum.WECHAT,
})

const aggregateInfo = ref<AggregateOrderAndConfigResult>({
  aggregateConfig: {},
  config: {},
  order: {},
})

onMounted(() => {
  init()
})

/**
 * 进入页面的初始化
 */
function init() {
  // 如果不是重定向跳转过来， 跳转到到重定向授权地址
  if (!authCode) {
    // 重定向跳转到微信授权地址
    generateAuthUrl({ orderNo: orderNo as string, aggregateType: CheckoutAggregateEnum.WECHAT }).then((res) => {
      const url = res.data
      location.replace(url)
    }).catch((res) => {
      router.push({ name: 'ErrorResult', query: { msg: res.message } })
    })
  }
  else {
    authParam.value.authCode = authCode as string
    // 初始化数据
    initData()
  }
}

/**
 * 初始化数据
 */
async function initData() {
  show.value = true
  // 获取聚合配置
  getAggregateConfig(orderNo, CheckoutAggregateEnum.WECHAT).then(({ data }) => {
    aggregateInfo.value = data
  }).catch((res) => {
    router.push({ name: 'ErrorResult', query: { msg: res.message } })
  })

  // 认证获取OpenId
  await auth(authParam.value).then(({ data }) => {
    openId.value = data.openId as string
  }).catch((res) => {
    router.push({ name: 'ErrorResult', query: { msg: res.message } })
  })
  // 判断是否自动拉起支付
  if (aggregateInfo.value.aggregateConfig.autoLaunch) {
    pay()
  }
}

/**
 * 微信jsapi方式支付
 */
function pay() {
  loading.value = true
  const from = {
    orderNo: orderNo as string,
    aggregateType: CheckoutAggregateEnum.WECHAT,
    openId: openId.value,
  } as CheckoutAggregatePayParam
  aggregatePay(from)
    .then(({ data }) => {
      loading.value = false
      // 拉起jsapi支付
      const json = JSON.parse(data.payBody)
      jsapiPay(json)
    })
}

/**
 * 拉起Jsapi支付窗口
 */
function jsapiPay(data: WxJsapiSignResult) {
  const form = {
    appId: data.appId, // 公众号ID，由商户传入
    timeStamp: data.timeStamp, // 时间戳，自1970年以来的秒数
    nonceStr: data.nonceStr, // 随机串
    package: data.package, // 预支付ID
    signType: data.signType, // 微信签名方式：
    paySign: data.paySign, // 微信签名
  }
  // 使用微信JsSdk拉起支付
  WeixinJSBridge.invoke('getBrandWCPayRequest', form, (res) => {
    if (res.err_msg === 'get_brand_wcpay_request:ok') {
      // 跳转到成功页面
      router.push({ name: 'SuccessResult', query: { msg: '支付成功' }, replace: true })
    }
  })
}
</script>

<style scoped lang="less">
@color: #4caf50;

:deep(.van-key--blue) {
  background: @color;
}
.container {
  background-color: @color;
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  text-align: center;
  color: white;
  .amount-display {
    background-color: white;
    color: @color;
    border-radius: 20px;
    padding: 20px;
    margin: 20px 0;
  }
  .amount-display p {
    margin: 5px 0;
  }
}
.remark {
  color: @color;
}
</style>
