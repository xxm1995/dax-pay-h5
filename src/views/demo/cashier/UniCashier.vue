<template>
  <div v-show="pageShow">
    <div class="h-screen flex justify-center pt-8">
      <van-overlay lock-scroll :show="loading">
        <Loading text="调起支付中..." />
      </van-overlay>
      <div class="w-full flex flex-col">
        <div class="flex flex-col items-center justify-center">
          <div class="logo enter-y my-35px">
            <SvgIcon class="!h-150px !w-150px" name="logo" />
          </div>
          <div class="text-darkBlue dark:text-garyWhite enter-y mb-80px text-45px font-black">
            手机收银台
          </div>
          <van-form ref="formRef">
            <van-cell-group inset>
              <van-field
                v-model="amount"
                type="number"
                required
                label="金额"
                :rules="[
                  { required: true, message: '请输入要支付的金额' },
                  { pattern: /^\d+(\.\d{2})?$/, message: '金额最为多两位小数' },
                  {
                    validator: validatorAmount,
                    message: '请输入0.01-100之间的金额',
                  },
                ]"
              />
              <van-field name="switch" label="过滤支付方式">
                <template #input>
                  <van-switch v-model="filterChannelFlag" size="24px" @change="initChannelList" />
                </template>
              </van-field>
            </van-cell-group>
          </van-form>
          <van-action-sheet
            v-model:show="channelShow"
            safe-area-inset-bottom
            :actions="channelList"
            @select="pay"
          />
          <van-action-bar safe-area-inset-bottom>
            <van-action-bar-button type="danger" text="支付" @click="paySelect" />
          </van-action-bar>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, unref } from 'vue'
import type { ActionSheetAction } from 'vant'
import { useRouter } from 'vue-router'
import { getPayEnv, getWxAuthUrl, simplePayCashier } from '@/views/demo/cashier/Cashier.api'
import router from '@/router'
import { payChannelEnum } from '@/enums/payment/payChannelEnum'
import { payMethodEnum } from '@/enums/payment/payMethodEnum'
import type { WxJsapiSignResult } from '@/views/demo/aggregate/Aggregate.api'
import Loading from '@/components/Loading.vue'

const pageShow = ref<boolean>(false)
const loading = ref<boolean>(false)
const channelShow = ref<boolean>(false)
const filterChannelFlag = ref<boolean>(true)
const amount = ref<number>(0.01)
const formRef = ref<any>()
// 当前环境
const currentEnv = ref<string>('all')
const openId = ref<string>('')

const channelList = ref<ActionSheetAction[]>([])

const { currentRoute } = useRouter()
const { query } = unref(currentRoute)

onMounted(() => {
  init()
})

/**
 * 初始化
 */
async function init() {
  await getPayEnv().then(({ data }) => {
    currentEnv.value = data
  })
  // 是否在微信环境中. 在的话获取微信授权
  if (currentEnv.value === payChannelEnum.WECHAT) {
    const source = query.source as string
    // 重定向则获取OpenId
    if (source === 'redirect') {
      openId.value = query.openId as string
    }
    else {
      // 跳转到微信授权地址
      const { data: url } = await getWxAuthUrl()
      location.replace(url)
      return
    }
  }
  initChannelList()
  pageShow.value = true
}

/**
 * 初始化通道列表
 */
function initChannelList() {
  channelList.value = [
    {
      name: '支付宝',
      disabled: channelFilter(payChannelEnum.ALI),
    },
    {
      name: '微信',
      disabled: channelFilter(payChannelEnum.WECHAT),
    },
  ]
}

/**
 * 过滤当前的状态是否可以使用
 */
function channelFilter(channel: string): boolean {
  // 未开启过滤
  if (!filterChannelFlag.value) {
    return false
  }
  // 返回为all
  if (currentEnv.value === 'all') {
    return false
  }
  // 如果返回通道, 只有当前符合环境的可以用
  return currentEnv.value !== channel
}

/**
 * 校验支付金额
 */
function validatorAmount(input: string) {
  if (Number.parseFloat(input) >= 0.01 && Number.parseFloat(input) <= 100) {
    return Promise.resolve(true)
  }
  else {
    return Promise.resolve(false)
  }
}

/**
 * 调起支付选择
 */
function paySelect() {
  // 校验表单
  formRef.value.validate().then(() => {
    // 拉起选择弹窗
    channelShow.value = true
  })
}

/**
 * 发起支付
 */
function pay(action: ActionSheetAction) {
  if (action.name === '微信') {
    wechatPay()
  }
  else {
    aliPay()
  }
}

/**
 * 发起微信支付
 * 1. 微信中使用jsapi
 * 2. 外部浏览器使用wap支付
 */
function wechatPay() {
  if (currentEnv.value === 'wechat_pay') {
    wechatJsapiPay()
  }
  else {
    wechatH5Pay()
  }
}

/**
 * 微信jsapi方式支付
 */
function wechatJsapiPay() {
  loading.value = true
  const from = {
    bizOrderNo: `M${new Date().getTime()}`,
    title: '测试H5支付',
    amount: amount.value,
    channel: payChannelEnum.WECHAT,
    method: payMethodEnum.JSAPI,
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
        name: 'PayErrorResult',
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
  WeixinJSBridge.invoke('getBrandWCPayRequest', form, (res) => {
    if (res.err_msg === 'get_brand_wcpay_request:ok') {
      setTimeout(() => {
        WeixinJSBridge.call('closeWindow')
      }, 0)
    }
  })
}

/**
 * 微信h5支付
 */
function wechatH5Pay() {
  loading.value = true
  const from = {
    bizOrderNo: new Date().getTime(),
    title: '测试H5支付',
    amount: amount.value,
    channel: payChannelEnum.WECHAT,
    method: payMethodEnum.WAP,
  }
  simplePayCashier(from)
    .then(({ data }) => {
      loading.value = false
      // 跳转到H5支付页面
      location.replace(data.payBody)
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
 * 支付宝支付, 使用h5支付
 */
function aliPay() {
  loading.value = true
  const from = {
    bizOrderNo: new Date().getTime(),
    title: '测试H5支付',
    amount: amount.value,
    channel: payChannelEnum.ALI,
    method: payMethodEnum.WAP,
  }
  simplePayCashier(from)
    .then(({ data }) => {
      loading.value = false
      // 跳转到H5支付页面
      window.location.href = data.payBody
    })
    .catch((err) => {
      // 跳转到错误页
      router.push({
        name: 'PayErrorResult',
        query: { msg: err.message },
      })
    })
}
</script>

<style scoped lang="less"></style>
