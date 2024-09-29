<template>
  <div>
    <div class="container">
      <div style="font-size: 28px;margin-top: 10px;">
        {{ cashierInfo.cashierName || '支付宝收银台' }}
      </div>
      <div class="amount-display">
        <p style="font-size: 20px">
          付款给{{ mchName }}
        </p>
        <p style="font-size: 32px;">
          ¥ {{ amount }}
        </p>
      </div>
    </div>
    <van-dialog
      v-model:show="show"
      title="支付备注"
      confirm-button-text="保存"
      cancel-button-text="清除"
      confirm-button-color="#108ee9"
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
          <div class="remark" @click="show = true">
            添加备注
          </div>
        </div>
      </template>
    </van-number-keyboard>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import type {
  CashierPayParam,
  ChannelCashierConfigResult,
} from '@/views/daxpay/channel/ChannelCashier.api'
import {
  cashierPay,
  getCashierInfo,
  getMchName,
} from '@/views/daxpay/channel/ChannelCashier.api'

import { CashierTypeEnum } from '@/enums/daxpay/DaxPayEnum'
import router from '@/router'

const route = useRoute()
const { mchNo, appId } = route.params

const show = ref<boolean>(false)
const loading = ref<boolean>(false)
const cashierInfo = ref<ChannelCashierConfigResult>({})
const amount = ref<string>('0')
const description = ref<string>('')
const mchName = ref<string>('')

onMounted(() => {
  initData()
})

/**
 * 初始化数据
 */
function initData() {
  getCashierInfo(CashierTypeEnum.ALIPAY, appId as string).then(({ data }) => {
    cashierInfo.value = data
  })
  getMchName(mchNo as string).then(({ data }) => {
    mchName.value = data
  })
}

/**
 * 输入
 */
function input(value: string) {
  const amountStr = amount.value
  if (amountStr === '0') {
    if (value === '.') {
      amount.value = '0.'
      return
    }
    amount.value = String(value)
  }
  else {
    // 只允许有一个小数点
    if (value === '.' && amountStr.includes('.')) {
      return
    }
    // 小数最多两位
    if (amountStr.includes('.') && amountStr.length - amountStr.indexOf('.') > 2) {
      return
    }
    // 金额最高100万
    if (amountStr.split('.')[0].length > 7 && value !== '.') {
      return
    }

    amount.value = amountStr.concat(value)
  }
}

/**
 * 删除
 */
function del() {
  if (amount.value.length > 1) {
    amount.value = amount.value.substring(0, amount.value.length - 1)
  }
  else {
    amount.value = '0'
  }
}

/**
 * 支付
 */
function pay() {
  // 金额不可为0
  if (amount.value === '0') {
    return
  }

  loading.value = true
  const from = {
    amount: Number(amount.value),
    appId,
    cashierType: CashierTypeEnum.ALIPAY,
    description: description.value,
    mchNo,
  } as CashierPayParam
  cashierPay(from)
    .then(({ data }) => {
      loading.value = false
      // 跳转到H5/付款码支付页面
      location.replace(data.payBody)
    })
    .catch((err) => {
      // 跳转到错误页
      router.push({
        name: 'ErrorResult',
        query: { msg: err.message },
      })
    })
}
</script>

<style scoped lang="less">
@color: #108ee9;

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
