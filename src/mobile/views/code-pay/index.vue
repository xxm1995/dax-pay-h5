<script lang="ts" setup>
import { showNotify } from 'vant'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

defineOptions({ name: 'CodePayPage' })

const route = useRoute()
const { code } = route.params

// 演示码牌配置（mock，金额类型 random 展示自定义金额输入）
const cashierInfo = ref({
  name: '演示收款商户',
  amountType: 'random' as 'random' | 'fixed',
  amount: '0',
})

const amount = ref('0')
const description = ref('')
const showRemark = ref(false)

// 金额输入（van-number-keyboard）
function onInput(key: string) {
  // 忽略第二个小数点
  if (key === '.' && amount.value.includes('.')) {
    return
  }
  if (amount.value === '0' && key !== '.') {
    amount.value = key
  }
  else {
    amount.value += key
  }
}

function onDelete() {
  amount.value = amount.value.slice(0, -1) || '0'
}

// 确认支付（演示）
function pay() {
  const value = Number(amount.value)
  if (!value) {
    showNotify({ type: 'warning', message: '金额不可为0' })
    return
  }
  showNotify({
    type: 'success',
    message: `演示：码牌 ${code} 支付 ¥${amount.value}`,
  })
}
</script>

<template>
  <div class="code-pay">
    <!-- 顶部品牌色块 -->
    <div class="code-pay__brand" />

    <!-- 商户 + 金额卡片 -->
    <div class="code-pay__card">
      <div class="code-pay__merchant">
        {{ cashierInfo.name }}
      </div>
      <div class="code-pay__amount-label">
        付款金额
      </div>
      <div class="code-pay__amount">
        <span class="code-pay__currency">¥</span>
        <span class="code-pay__amount-value" :class="{ 'code-pay__amount-value--zero': amount === '0' }">
          {{ amount }}
        </span>
      </div>
    </div>

    <!-- 备注单元格 -->
    <div class="code-pay__remark" @click="showRemark = true">
      <span class="code-pay__remark-label">备注</span>
      <div class="code-pay__remark-value">
        <span v-if="!description" class="code-pay__remark-placeholder">添加备注</span>
        <span v-else>{{ description }}</span>
      </div>
      <span class="code-pay__remark-arrow">›</span>
    </div>

    <!-- 备注弹窗 -->
    <van-dialog
      v-model:show="showRemark"
      title="添加备注"
      show-cancel-button
      confirm-button-text="保存"
      cancel-button-text="取消"
      confirm-button-color="#108ee9"
      cancel-button-color="#999"
    >
      <van-field
        v-model="description"
        rows="3"
        autosize
        type="textarea"
        :maxlength="50"
        placeholder="请输入支付备注内容"
        show-word-limit
        class="code-pay__remark-field"
      />
    </van-dialog>

    <!-- 随机金额：数字键盘 -->
    <van-number-keyboard
      v-if="cashierInfo.amountType === 'random'"
      theme="custom"
      extra-key="."
      close-button-text="确认支付"
      :show="true"
      @close="pay"
      @input="onInput"
      @delete="onDelete"
    />
  </div>
</template>

<style scoped lang="less">
@brand: #108ee9;
@bg: #f5f5f5;
@text-main: #333;
@text-sub: #999;

:deep(.van-key--blue) {
  background: @brand;
  color: #fff;
}

.code-pay {
  min-height: 100vh;
  background: @bg;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: 220px;

  &__brand {
    height: 120px;
    background: @brand;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }

  &__card {
    position: relative;
    z-index: 1;
    background: #fff;
    border-radius: 12px;
    padding: 24px;
    margin: 40px 16px 0;
    box-shadow: 0 4px 16px rgb(0 0 0 / 8%);
  }

  &__merchant {
    text-align: center;
    margin-bottom: 24px;
    font-size: 18px;
    font-weight: 600;
    color: @text-main;
  }

  &__amount-label {
    font-size: 14px;
    color: @text-main;
    margin-bottom: 12px;
  }

  &__amount {
    display: flex;
    align-items: baseline;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
  }

  &__currency {
    font-size: 28px;
    font-weight: 500;
    margin-right: 8px;
    color: @text-main;
  }

  &__amount-value {
    font-size: 40px;
    font-weight: 600;
    color: @text-main;
    flex: 1;
    line-height: 1.2;

    &--zero {
      color: #ccc;
    }
  }

  &__remark {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    margin: 16px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 8px rgb(0 0 0 / 2%);
  }

  &__remark-label {
    font-size: 15px;
    color: @text-main;
    width: 60px;
  }

  &__remark-value {
    flex: 1;
    font-size: 15px;
    margin: 0 12px;
    text-align: right;
  }

  &__remark-placeholder {
    color: #ccc;
  }

  &__remark-arrow {
    color: #ccc;
    font-size: 18px;
  }

  &__remark-field {
    padding: 16px;
  }
}
</style>
