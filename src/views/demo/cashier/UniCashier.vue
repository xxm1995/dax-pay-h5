<template>
  <div>
    <div class="flex justify-center h-screen pt-8">
      <van-overlay lock-scroll :show="loading">
        <Loading text="调起支付中..." />
      </van-overlay>
      <div class="flex flex-col w-full">
        <div class="flex flex-col items-center justify-center">
          <div class="logo my-35px enter-y">
            <SvgIcon class="!h-250px !w-250px" name="logo" />
          </div>
          <div class="mb-80px text-darkBlue dark:text-garyWhite text-45px font-black enter-y">
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
                  <van-switch v-model="filterChannelFlag" @change="initChannelList" size="24px" />
                </template>
              </van-field>
            </van-cell-group>
          </van-form>
          <van-action-sheet
            safe-area-inset-bottom
            v-model:show="channelShow"
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
  import Loading from '@/components/Loading/Loading.vue'
  import { onMounted, ref } from 'vue'
  import SvgIcon from '@/components/SvgIcon/SvgIcon.vue'
  import { getPayEnv, simplePayCashier } from '@/views/demo/cashier/Cashier.api'
  import { ActionSheetAction } from 'vant'
  import router from '@/router'
  import { payChannelEnum } from '@/enums/payment/payChannelEnum'
  import { payWayEnum } from "@/enums/payment/payWayEnum";

  let loading = ref<boolean>(false)
  let channelShow = ref<boolean>(false)
  let filterChannelFlag = ref<boolean>(true)
  let amount = ref<number>(0.01)
  let formRef = ref<any>()
  // 当前环境
  let currentEnv = ref<string>('all')

  const channelList = ref<ActionSheetAction[]>([])

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
    initChannelList()
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
    if (parseFloat(input) >= 0.01 && parseFloat(input) <= 100) {
      return Promise.resolve(true)
    } else {
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
  function pay(value) {
    if (value === '微信') {
      wechatPay()
    } else {
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
    } else {
      wechatH5Pay()
    }
  }
  function wechatJsapiPay() {}
  function wechatH5Pay() {}

  /**
   * 支付宝支付, 使用h5支付
   */
  function aliPay() {
    const from = {
      businessNo: new Date().getTime(),
      title: '测试H5支付',
      amount: amount.value,
      channel: payChannelEnum.ALI,
      payWay: payWayEnum.WAP,
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
