<template>
  <div v-if="show">
    <div class="container">
      <div style="font-size: 28px;margin-top: 10px;">
        {{ cashierTypeConfig.name || '微信收银台' }}
      </div>
      <div class="amount-display">
        <p style="font-size: 20px">
          付款金额
        </p>
        <p style="font-size: 32px;">
          ¥ {{ amount }}
        </p>
      </div>
    </div>
    <van-dialog
      v-model:show="showRemark"
      title="支付备注"
      confirm-button-text="保存"
      cancel-button-text="清除"
      confirm-button-color="#4CAF50"
      cancel-button-color="red"
      show-cancel-button
      @cancel="description = ''"
    >
      <van-field
        v-model="description"
        rows="2"
        autosize
        label=""
        type="textarea"
        :maxlength="50"
        placeholder="请输入支付备注内容"
        show-word-limit
      />
    </van-dialog>
    <van-number-keyboard
      :show="true"
      theme="custom"
      extra-key="."
      close-button-text="付款"
      @close="pay"
      @input="input"
      @delete="del"
    >
      <template #title-left>
        <div style="width: 100vw;display: flex; justify-content: center">
          <div class="remark" @click="showRemark = true">
            <div v-if="!description">
              添加备注
            </div>
            <div v-else style="max-width: 75vw;">
              <van-text-ellipsis :content="`备注: ${description}`" /><div />
            </div>
          </div>
        </div>
      </template>
    </van-number-keyboard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { showNotify } from 'vant'
import type {
  CashierAuthParam,
  CashierPayParam,
  CashierTypeConfigResult,
  WxJsapiSignResult,
} from '@/views/daxpay/cashier/CashierCode.api'
import {
  auth
  , cashierPay,
  generateAuthUrl,
  getCashierTypeConfig,
} from '@/views/daxpay/cashier/CashierCode.api'

import { CashierTypeEnum } from '@/enums/daxpay/DaxPayEnum'
import router from '@/router'
import { useKeyboard } from '@/hooks/daxpay/useKeyboard'

const route = useRoute()
const { code } = route.params
const { code: authCode } = route.query

const show = ref<boolean>(false)
const showRemark = ref<boolean>(false)
const loading = ref<boolean>(false)
const cashierTypeConfig = ref<CashierTypeConfigResult>({})
const amount = ref<string>('0')
const description = ref<string>('')
const openId = ref<string>('')

// 认证参数
const authParam = ref<CashierAuthParam>({
  cashierCode: code as string,
  cashierType: CashierTypeEnum.WECHAT_PAY,
})
const { input, del } = useKeyboard(amount)

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
    generateAuthUrl({ cashierType: CashierTypeEnum.WECHAT_PAY, cashierCode: code as string }).then((res) => {
      const url = res.data
      location.replace(url)
    }).catch((res) => {
      router.push({ name: 'ErrorResult', query: { msg: res.message }, replace: true  })
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
function initData() {
  show.value = true
  // 获取配置参数
  getCashierTypeConfig(CashierTypeEnum.WECHAT_PAY, code as string).then(({ data }) => {
    cashierTypeConfig.value = data
  }).catch((res) => {
    router.push({ name: 'ErrorResult', query: { msg: res.message }, replace: true  })
  })

  // 认证获取OpenId
  auth(authParam.value).then(({ data }) => {
    openId.value = data.openId as string
  }).catch((res) => {
    router.push({ name: 'ErrorResult', query: { msg: res.message }, replace: true  })
  })
}

/**
 * 微信jsapi方式支付
 */
function pay() {
  const amountValue = Number(amount.value)
  if (amountValue === 0) {
    showNotify({ type: 'warning', message: '金额不可为0' })
    return
  }

  loading.value = true
  const from = {
    cashierCode: code,
    amount: amountValue,
    openId: openId.value,
    cashierType: CashierTypeEnum.WECHAT_PAY,
    description: description.value,
  } as CashierPayParam
  cashierPay(from)
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
