<script lang="ts" setup>
import { showToast } from 'vant'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'

defineOptions({ name: 'CashierPage' })

const route = useRoute()

// 演示订单数据（mock，不连后端）
const order = {
  title: 'DaxPay 演示订单',
  orderNo: route.params.orderNo as string,
  amount: 0.01,
  // 15 分钟后过期
  expiredTime: Date.now() + 15 * 60 * 1000,
}

// 演示支付方式（mock）
interface PayMethod {
  id: string
  name: string
  icon: 'wechat' | 'alipay' | 'union'
  recommend?: boolean
}
const payMethods: PayMethod[] = [
  { id: '1', name: '微信支付', icon: 'wechat', recommend: true },
  { id: '2', name: '支付宝', icon: 'alipay' },
  { id: '3', name: '银联支付', icon: 'union' },
]

// 选中的支付方式（默认推荐项）
const selectId = ref<string>(payMethods[0]!.id)

// 图标字符映射
function iconText(icon: PayMethod['icon']) {
  return { wechat: '微', alipay: '支', union: '银' }[icon]
}

// 倒计时（原生 setInterval，项目无 @vueuse/core）
const remainSeconds = ref(0)
let timer: ReturnType<typeof setInterval> | null = null
const countdown = computed(() => {
  const s = remainSeconds.value
  const h = String(Math.floor(s / 3600)).padStart(2, '0')
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return { h, m, s: sec }
})

function startCountdown() {
  remainSeconds.value = Math.max(0, Math.floor((order.expiredTime - Date.now()) / 1000))
  timer = setInterval(() => {
    if (remainSeconds.value > 0) {
      remainSeconds.value--
    }
    else if (timer) {
      clearInterval(timer)
    }
  }, 1000)
}

// 发起支付（演示）
function pay() {
  const selected = payMethods.find(it => it.id === selectId.value)
  showToast({
    type: 'success',
    message: `演示：已发起 ${selected?.name ?? ''} 支付`,
  })
}

onMounted(startCountdown)
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<template>
  <div class="cashier">
    <!-- 顶部订单信息 -->
    <div class="cashier__header">
      <div class="cashier__price">
        <span class="cashier__currency">￥</span>
        <span class="cashier__amount">{{ order.amount }}</span>
      </div>
      <div class="cashier__countdown">
        <span class="cashier__countdown-label">支付剩余时间</span>
        <span class="cashier__countdown-time">
          {{ countdown.h }}:{{ countdown.m }}:{{ countdown.s }}
        </span>
      </div>
      <div class="cashier__detail">
        <div class="cashier__detail-row">
          <span>订单标题</span>
          <span>{{ order.title }}</span>
        </div>
        <div class="cashier__detail-row">
          <span>订单编号</span>
          <span>{{ order.orderNo }}</span>
        </div>
      </div>
    </div>

    <!-- 支付方式选择 -->
    <div class="cashier__body">
      <div class="cashier__section-title">
        请选择支付方式
      </div>
      <div class="cashier__list">
        <div
          v-for="item in payMethods"
          :key="item.id"
          class="cashier__item"
          :class="{ 'cashier__item--active': item.id === selectId }"
          @click="selectId = item.id"
        >
          <div class="cashier__item-info">
            <div class="cashier__pay-icon" :class="`cashier__pay-icon--${item.icon}`">
              {{ iconText(item.icon) }}
            </div>
            <div class="cashier__pay-name">
              {{ item.name }}
              <span v-if="item.recommend" class="cashier__recommend">推荐</span>
            </div>
          </div>
          <div class="cashier__radio" :class="{ 'cashier__radio--checked': item.id === selectId }" />
        </div>
      </div>
    </div>

    <!-- 底部支付按钮 -->
    <div class="cashier__footer">
      <button class="cashier__pay-btn" @click="pay">
        立即支付 ￥{{ order.amount }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="less">
@primary: #0d6eff;
@danger: #ff4d4f;
@text-main: #333;
@text-sub: #999;
@bg: #f8f9fa;
@card: #fff;
@border: #eee;

.cashier {
  min-height: 100vh;
  background: @bg;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  &__header {
    background: @card;
    padding: 24px 20px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 2px 10px rgb(0 0 0 / 5%);
  }

  &__price {
    display: flex;
    align-items: baseline;
    color: @primary;
    margin-bottom: 8px;
  }

  &__currency {
    font-size: 20px;
    font-weight: 600;
  }

  &__amount {
    font-size: 44px;
    font-weight: 800;
    letter-spacing: -1px;
  }

  &__countdown {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    background: #fff1f0;
    padding: 6px 16px;
    border-radius: 100px;
  }

  &__countdown-label {
    font-size: 12px;
    color: @danger;
  }

  &__countdown-time {
    color: @danger;
    font-weight: 700;
    font-size: 14px;
    font-family: 'PingFang SC', sans-serif;
  }

  &__detail {
    width: 100%;
    border-top: 1px solid @border;
    padding-top: 12px;
  }

  &__detail-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    margin-bottom: 6px;

    span:first-child {
      color: @text-sub;
    }

    span:last-child {
      color: @text-main;
    }
  }

  &__body {
    padding: 24px 20px;
  }

  &__section-title {
    font-size: 16px;
    font-weight: 600;
    color: @text-main;
    margin-bottom: 16px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__item {
    background: @card;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 2px solid transparent;
    transition: all 0.2s ease;

    &--active {
      border-color: @primary;
      background: #f0f7ff;
    }
  }

  &__item-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__pay-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 16px;
    font-weight: 600;

    &--wechat {
      background: #07c160;
    }

    &--alipay {
      background: #1677ff;
    }

    &--union {
      background: #e60012;
    }
  }

  &__pay-name {
    font-size: 16px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__recommend {
    font-size: 12px;
    color: #fa8c16;
    background: #fff7e6;
    border: 1px solid #ffd591;
    padding: 0 4px;
    border-radius: 4px;
  }

  &__radio {
    width: 20px;
    height: 20px;
    border: 2px solid #d9d9d9;
    border-radius: 50%;
    transition: all 0.2s;

    &--checked {
      border-color: @primary;
      background: @primary;
      box-shadow: inset 0 0 0 3px #fff;
    }
  }

  &__footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 20px 20px;
    background: @card;
    box-shadow: 0 -2px 10px rgb(0 0 0 / 5%);
  }

  &__pay-btn {
    width: 100%;
    height: 48px;
    background: @primary;
    color: #fff;
    border: none;
    border-radius: 100px;
    font-size: 18px;
    font-weight: 600;

    &:active {
      opacity: 0.85;
    }
  }
}
</style>
