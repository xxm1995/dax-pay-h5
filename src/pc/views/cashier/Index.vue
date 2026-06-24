<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'

defineOptions({ name: 'PcCashier' })

const route = useRoute()

// 演示订单数据（mock，不连后端）
const order = {
  title: 'DaxPay 演示订单',
  orderNo: route.params.orderNo as string,
  amount: 0.01,
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

// 支付后展示二维码占位
const showQrcode = ref(false)

function pay() {
  showQrcode.value = true
}

onMounted(startCountdown)
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<template>
  <div class="pc-cashier">
    <div class="pc-cashier__box">
      <!-- 订单头部 -->
      <div class="pc-cashier__header">
        <div class="pc-cashier__countdown">
          <span class="pc-cashier__countdown-label">剩余支付时间</span>
          <span class="pc-cashier__countdown-time">
            {{ countdown.h }}:{{ countdown.m }}:{{ countdown.s }}
          </span>
        </div>
        <div class="pc-cashier__title">
          {{ order.title }}
        </div>
        <div class="pc-cashier__price">
          <span class="pc-cashier__price-label">应付金额</span>
          <p>
            <span>￥</span>{{ order.amount }}
          </p>
        </div>
        <div class="pc-cashier__order-no">
          订单编号: {{ order.orderNo }}
        </div>
      </div>

      <!-- 内容区 -->
      <div class="pc-cashier__content">
        <!-- 支付方式网格（支付前） -->
        <div v-if="!showQrcode" class="pc-cashier__grid">
          <div
            v-for="item in payMethods"
            :key="item.id"
            class="pc-cashier__method"
            :class="{ 'pc-cashier__method--active': item.id === selectId }"
            @click="selectId = item.id"
          >
            <span class="pc-cashier__method-icon" :class="`pc-cashier__method-icon--${item.icon}`">
              {{ { wechat: '微', alipay: '支', union: '银' }[item.icon] }}
            </span>
            <span class="pc-cashier__method-name">{{ item.name }}</span>
            <span v-if="item.recommend" class="pc-cashier__recommend">推荐</span>
          </div>
        </div>

        <!-- 二维码占位（支付后） -->
        <div v-else class="pc-cashier__qrcode">
          <div class="pc-cashier__qrcode-box">
            <svg viewBox="0 0 100 100" class="pc-cashier__qrcode-svg" aria-hidden="true">
              <rect width="100" height="100" fill="#fff" />
              <g fill="#1d2129">
                <rect x="8" y="8" width="24" height="24" />
                <rect x="14" y="14" width="12" height="12" fill="#fff" />
                <rect x="18" y="18" width="4" height="4" />
                <rect x="68" y="8" width="24" height="24" />
                <rect x="74" y="14" width="12" height="12" fill="#fff" />
                <rect x="78" y="18" width="4" height="4" />
                <rect x="8" y="68" width="24" height="24" />
                <rect x="14" y="74" width="12" height="12" fill="#fff" />
                <rect x="18" y="78" width="4" height="4" />
                <rect x="40" y="8" width="6" height="6" /><rect x="54" y="8" width="6" height="6" />
                <rect x="40" y="20" width="6" height="6" /><rect x="54" y="20" width="6" height="6" />
                <rect x="8" y="40" width="6" height="6" /><rect x="20" y="40" width="6" height="6" />
                <rect x="40" y="40" width="6" height="6" /><rect x="54" y="40" width="6" height="6" />
                <rect x="68" y="40" width="6" height="6" /><rect x="86" y="40" width="6" height="6" />
                <rect x="40" y="54" width="6" height="6" /><rect x="68" y="54" width="6" height="6" />
                <rect x="86" y="54" width="6" height="6" />
                <rect x="40" y="68" width="6" height="6" /><rect x="54" y="68" width="6" height="6" />
                <rect x="68" y="68" width="6" height="6" /><rect x="86" y="68" width="6" height="6" />
                <rect x="40" y="80" width="6" height="6" /><rect x="68" y="80" width="6" height="6" />
                <rect x="86" y="80" width="6" height="6" />
              </g>
            </svg>
          </div>
          <div class="pc-cashier__qrcode-tip">
            <p class="pc-cashier__qrcode-title">
              扫码支付（演示）
            </p>
            <p class="pc-cashier__qrcode-sub">
              请使用 {{ payMethods.find(i => i.id === selectId)?.name }} 扫码完成支付
            </p>
          </div>
        </div>
      </div>

      <!-- 立即支付按钮（支付前） -->
      <button v-if="!showQrcode" class="pc-cashier__pay-btn" @click="pay">
        立即支付
      </button>
    </div>
  </div>
</template>

<style scoped>
/* PC 端收银台：scoped 原生 px + 媒体查询，不使用 UnoCSS 的 px 原子类 */
.pc-cashier {
  width: 100%;
  min-height: 100vh;
  background: #f0f4fb;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32px 16px;
  box-sizing: border-box;
}

.pc-cashier__box {
  width: 1000px;
  max-width: 100%;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.pc-cashier__header {
  background: linear-gradient(135deg, #f5f7ff 0%, #eef2ff 100%);
  padding: 30px 40px;
  border-bottom: 1px solid #edf2f7;
  position: relative;
}

.pc-cashier__countdown {
  position: absolute;
  right: 30px;
  top: 30px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.8);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.pc-cashier__countdown-label {
  font-size: 14px;
  color: #64748b;
}

.pc-cashier__countdown-time {
  font-size: 16px;
  font-weight: 600;
  color: #ff4d4f;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
}

.pc-cashier__title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.pc-cashier__price {
  margin-top: 32px;
  margin-bottom: 16px;
}

.pc-cashier__price-label {
  font-size: 16px;
  color: #64748b;
}

.pc-cashier__price p {
  font-size: 48px;
  color: #ff4d4f;
  font-weight: 800;
  line-height: 1;
  margin: 8px 0 0;
}

.pc-cashier__price p span {
  font-size: 24px;
  margin-right: 4px;
}

.pc-cashier__order-no {
  font-size: 14px;
  color: #94a3b8;
}

.pc-cashier__content {
  flex: 1;
  background: #fff;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
}

.pc-cashier__grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.pc-cashier__method {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 2px solid #f1f5f9;
  border-radius: 12px;
  height: 80px;
  cursor: pointer;
  background: #f8fafc;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.pc-cashier__method:hover {
  border-color: #4073e1;
  background: #f0f7ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 115, 225, 0.1);
}

.pc-cashier__method--active {
  border-color: #4073e1;
  background: #f0f7ff;
  box-shadow: 0 4px 12px rgba(64, 115, 225, 0.15);
}

.pc-cashier__method-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.pc-cashier__method-icon--wechat {
  background: #07c160;
}

.pc-cashier__method-icon--alipay {
  background: #1677ff;
}

.pc-cashier__method-icon--union {
  background: #e60012;
}

.pc-cashier__method-name {
  font-size: 16px;
  font-weight: 500;
  color: #1e293b;
}

.pc-cashier__recommend {
  font-size: 12px;
  color: #f59e0b;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: auto;
  white-space: nowrap;
}

.pc-cashier__qrcode {
  display: flex;
  align-items: center;
  gap: 40px;
}

.pc-cashier__qrcode-box {
  width: 200px;
  height: 200px;
  padding: 10px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.pc-cashier__qrcode-svg {
  width: 100%;
  height: 100%;
}

.pc-cashier__qrcode-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px;
}

.pc-cashier__qrcode-sub {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.pc-cashier__pay-btn {
  position: absolute;
  right: 40px;
  bottom: 40px;
  width: 200px;
  height: 54px;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  background: #4073e1;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.pc-cashier__pay-btn:hover {
  background: #3a66c9;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .pc-cashier__grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .pc-cashier__qrcode {
    flex-direction: column;
    gap: 20px;
  }

  .pc-cashier__pay-btn {
    position: static;
    width: 100%;
    margin: 20px 0 0;
  }
}
</style>
