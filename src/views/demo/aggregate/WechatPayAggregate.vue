<template>
  <div class="flex flex-col justify-center page-container">
    <van-overlay lock-scroll :show="loading">
      <Loading text="调起支付中..." />
    </van-overlay>
    <div class="text-center">
      <h1>金额: {{ info.amount / 100.0 }} 元</h1>
      <h1>标题: {{ info.title }}</h1>
      <h1>业务号: {{ info.businessNo }}</h1>
    </div>
    <div class="text-center">
      <van-button type="primary" @click="pay">去支付</van-button>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { onMounted, ref, unref } from 'vue'
  import { AggregatePayInfo, getWxJsapiPay, getInfo, WxJsapiSignResult } from './Aggregate.api'
  import { useRouter } from 'vue-router'
  import router from '@/router'
  import Loading from '@/components/Loading/Loading.vue'

  const { currentRoute } = useRouter()
  const { query } = unref(currentRoute)

  const aggregateCode = ref<string>(query.aggregateCode as string)
  const openId = ref<string>(query.openId as string)
  const info = ref<AggregatePayInfo>({})
  const loading = ref<boolean>(false)

  onMounted(() => {
    init()
  })

  /**
   * 根据code获取支付信息
   */
  function init() {
    loading.value = true
    // 获取支付信息
    getInfo(aggregateCode.value)
      .then(({ data }) => {
        loading.value = false
        info.value = data
      })
      .catch((err) => {
        // 跳转到错误页
        router.push({
          name: 'PayErrorResult',
          query: { msg: err.message },
        })
      })
  }

  /**
   * 发起支付
   */
  function pay() {
    loading.value = true
    getWxJsapiPay(aggregateCode.value, openId.value)
      .then(({ data }) => {
        loading.value = false
        doPay(data)
      })
      .catch(() => {
        // 跳转到错误页
        router.push({
          name: 'PayErrorResult',
          query: { msg: '支付失败' },
        })
      })
  }

  /**
   * 拉起支付
   */
  function doPay(data: WxJsapiSignResult) {
    const form = {
      appId: data.appId, //公众号ID，由商户传入
      timeStamp: data.timeStamp, //时间戳，自1970年以来的秒数
      nonceStr: data.nonceStr, //随机串
      package: data.package, // 预支付ID
      signType: data.signType, //微信签名方式：
      paySign: data.paySign, //微信签名
    }
    // 使用微信JsSdk拉起支付
    WeixinJSBridge.invoke('getBrandWCPayRequest', form, function (res) {
      if (res.err_msg === 'get_brand_wcpay_request:ok') {
        setTimeout(() => {
          WeixinJSBridge.call('closeWindow')
        }, 0)
      }
    })
  }
</script>

<style lang="less" scoped>
  .page-container {
    width: 100%;
    border-radius: 4px;
    padding: 50px 0;
    height: 100vh;

    .text-center {
      h1 {
        color: #666;
        padding: 2vh 0;
        font-size: x-large;
      }
    }
  }
</style>
