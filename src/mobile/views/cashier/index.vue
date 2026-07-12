<script lang="ts" setup>
import { showToast } from 'vant'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

defineOptions({ name: 'CashierPage' })

const { t } = useI18n()
const route = useRoute()

// 演示订单数据（mock，不连后端）
const order = computed(() => ({
  title: t('cashier.demoOrderTitle'),
  orderNo: route.params.orderNo as string,
  amount: 0.01,
  // 15 分钟后过期
  expiredTime: Date.now() + 15 * 60 * 1000,
}))

// 演示支付方式（mock）— name 由 i18n 按 icon 渲染
interface PayMethod {
  id: string
  icon: 'wechat' | 'alipay' | 'union_pay'
  recommend?: boolean
}
const payMethods: PayMethod[] = [
  { id: '1', icon: 'wechat', recommend: true },
  { id: '2', icon: 'alipay' },
  { id: '3', icon: 'union_pay' },
]

// 支付方式名称（跟随语言）
function methodName(item: PayMethod) {
  return t(`cashier.method.${item.icon}`)
}

// 选中的支付方式（默认推荐项）
const selectId = ref<string>(payMethods[0]!.id)

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
  remainSeconds.value = Math.max(0, Math.floor((order.value.expiredTime - Date.now()) / 1000))
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
    message: t('cashier.demoPayStarted', { name: selected ? methodName(selected) : '' }),
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
    <div class="cashier__header enter-y">
      <div class="cashier__price">
        <span class="cashier__currency">￥</span>
        <span class="cashier__amount">{{ order.amount }}</span>
      </div>
      <div class="cashier__countdown">
        <span class="cashier__countdown-label">{{ t('cashier.remainTime') }}</span>
        <span class="cashier__countdown-time">
          {{ countdown.h }}:{{ countdown.m }}:{{ countdown.s }}
        </span>
      </div>
      <div class="cashier__detail">
        <div class="cashier__detail-row">
          <span>{{ t('cashier.orderTitle') }}</span>
          <span>{{ order.title }}</span>
        </div>
        <div class="cashier__detail-row">
          <span>{{ t('cashier.orderNo') }}</span>
          <span>{{ order.orderNo }}</span>
        </div>
      </div>
    </div>

    <!-- 支付方式选择 -->
    <div class="cashier__body enter-y">
      <div class="cashier__section-title">
        {{ t('cashier.selectMethod') }}
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
              <!-- 内联 SVG 品牌图标：微信支付 / 支付宝 / 银联 -->
              <svg v-if="item.icon === 'wechat'" viewBox="0 0 1024 1024" width="22" height="22" aria-hidden="true">
                <path fill="#fff" d="M690.1 377.4c5.9 0 11.8.2 17.6.5-24.4-128.7-158.3-227.1-322.3-227.1C205.2 150.8 64 271.4 64 420.2c0 81.1 43.6 146.4 116.6 197.4l-29.2 88.4 102.2-52.6c36.5 7.2 65.9 14.6 101.9 14.6 5.4 0 10.8-.2 16.2-.5-3.4-11.8-5.3-24.1-5.3-36.9 0-153.7 129.4-253.2 323.7-253.2zM544.9 267.6c21.5 0 35.7 14.2 35.7 35.7 0 21.3-14.2 35.8-35.7 35.8s-42.9-14.5-42.9-35.8c0-21.5 21.4-35.7 42.9-35.7zM269.3 338.3c-21.5 0-43.3-14.2-43.3-35.7 0-21.3 21.8-35.8 43.3-35.8 21.3 0 35.6 14.5 35.6 35.8 0 21.5-14.3 35.7-35.6 35.7z" />
              </svg>
              <svg v-else-if="item.icon === 'alipay'" viewBox="0 0 1024 1024" width="22" height="22" aria-hidden="true">
                <path fill="#fff" d="M843.1 608.6c-23.4-49.7-54.2-105.8-91.7-166.2-37.8-60.4-77.1-115.3-117.6-164.4-44.6-12.3-91.7-18.8-140.4-18.8-101.3 0-194.4 34.4-266.9 91.9-83.3 66-133.5 162.7-133.5 269.5 0 103.9 49.5 199.1 133.7 265.7 76.2 60.2 174.3 95.3 280.1 95.3 138.6 0 262.2-57.3 339-147.1-33.9-26-99-62.7-202.9-99.3-29.4 39.5-72.9 64.8-128.1 64.8-99.5 0-176.4-72.2-176.4-176.4 0-99.1 71.5-177 176.4-177 78.2 0 137.6 41.6 161.8 103.9 73.6 30.9 132.3 56.9 167.4 76.5l72.1 36.1z" />
              </svg>
              <svg v-else viewBox="0 0 1024 1024" width="22" height="22" aria-hidden="true">
                <path fill="#fff" d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm130.4 590.4c-39.1 27.8-86.8 43.6-138.4 43.6-130.4 0-236-105.6-236-236s105.6-236 236-236c45.6 0 88.2 13 124 35.4l-58.5 58.5c-19.4-9-40.9-14-63.5-14-85.2 0-154.4 69.2-154.4 154.4S384.8 544.3 470 544.3c52.6 0 98.9-26.4 126.4-66.6l70.6 70.6c-7.8 2.1-15.8 4-24.6 6.7z" />
              </svg>
            </div>
            <div class="cashier__pay-name">
              {{ methodName(item) }}
              <span v-if="item.recommend" class="cashier__recommend">{{ t('cashier.recommend') }}</span>
            </div>
          </div>
          <div class="cashier__radio" :class="{ 'cashier__radio--checked': item.id === selectId }" />
        </div>
      </div>
    </div>

    <!-- 底部支付按钮 -->
    <div class="cashier__footer enter-y">
      <button class="cashier__pay-btn" @click="pay">
        {{ t('cashier.payNow') }} ￥{{ order.amount }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="less">
// 局部主色统一为全局主题色 #5d9dfe，派生加深色用于 hover/active
@primary: #5d9dfe;
@primary-dark: #4a87e0;
@danger: #ff4d4f;
@text-main: #333;
@text-sub: #999;
@bg: #f5f6fa;
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
    // header 加主色调浅渐变，与金额蓝色呼应
    background: linear-gradient(180deg, #f0f6ff 0%, #ffffff 100%);
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
    // 金额数字加主色调柔和投影，增强层次
    text-shadow: 0 2px 8px rgba(93, 157, 254, 0.2);
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
      // 选中底色统一为 #eaf2fe
      background: #eaf2fe;
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

    svg {
      display: block;
    }

    &--wechat {
      background: #07c160;
    }

    &--alipay {
      background: #1677ff;
    }

    &--union_pay {
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
    // 主色调阴影增强按钮质感
    box-shadow: 0 4px 12px rgba(93, 157, 254, 0.3);

    &:active {
      background: @primary-dark;
      opacity: 0.95;
    }
  }
}
</style>
