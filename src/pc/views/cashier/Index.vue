<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

defineOptions({ name: 'PcCashier' })

const { t } = useI18n()
const route = useRoute()

// 演示订单数据（mock，不连后端）
const order = computed(() => ({
  title: t('cashier.demoOrderTitle'),
  orderNo: route.params.orderNo as string,
  amount: 0.01,
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
          <span class="pc-cashier__countdown-label">{{ t('cashier.remainTimeShort') }}</span>
          <span class="pc-cashier__countdown-time">
            {{ countdown.h }}:{{ countdown.m }}:{{ countdown.s }}
          </span>
        </div>
        <div class="pc-cashier__title">
          {{ order.title }}
        </div>
        <div class="pc-cashier__price">
          <span class="pc-cashier__price-label">{{ t('cashier.payableAmount') }}</span>
          <p>
            <span>￥</span>{{ order.amount }}
          </p>
        </div>
        <div class="pc-cashier__order-no">
          {{ t('cashier.orderNoLabel') }}{{ order.orderNo }}
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
            </span>
            <span class="pc-cashier__method-name">{{ methodName(item) }}</span>
            <span v-if="item.recommend" class="pc-cashier__recommend">{{ t('cashier.recommend') }}</span>
          </div>
        </div>

        <!-- 二维码占位（支付后） -->
        <div v-else class="pc-cashier__qrcode">
          <div class="pc-cashier__qrcode-box">
            <!-- 四角 L 型装饰角标，提升扫码区仪式感 -->
            <span class="pc-cashier__corner pc-cashier__corner--tl" />
            <span class="pc-cashier__corner pc-cashier__corner--tr" />
            <span class="pc-cashier__corner pc-cashier__corner--bl" />
            <span class="pc-cashier__corner pc-cashier__corner--br" />
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
              {{ t('cashier.qrcodePayDemo') }}
            </p>
            <p class="pc-cashier__qrcode-sub">
              {{ t('cashier.qrcodeTip', { name: methodName(payMethods.find(i => i.id === selectId)!) }) }}
            </p>
          </div>
        </div>
      </div>

      <!-- 立即支付按钮（支付前） -->
      <button v-if="!showQrcode" class="pc-cashier__pay-btn" @click="pay">
        {{ t('cashier.payNow') }}
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
  /* header 渐变带主色调，与统一主色 #5d9dfe 呼应 */
  background: linear-gradient(135deg, #eaf2fe 0%, #f5f9ff 100%);
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
  border-color: #5d9dfe;
  background: #eaf2fe;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(93, 157, 254, 0.12);
}

.pc-cashier__method--active {
  border-color: #5d9dfe;
  background: #eaf2fe;
  box-shadow: 0 4px 12px rgba(93, 157, 254, 0.18);
}

.pc-cashier__method-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.pc-cashier__method-icon svg {
  display: block;
}

.pc-cashier__method-icon--wechat {
  background: #07c160;
}

.pc-cashier__method-icon--alipay {
  background: #1677ff;
}

.pc-cashier__method-icon--union_pay {
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
  border: 1px dashed #5d9dfe;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(93, 157, 254, 0.08);
  position: relative;
}

/* 二维码区四角 L 型装饰角标 */
.pc-cashier__corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid #5d9dfe;
}

.pc-cashier__corner--tl {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
  border-top-left-radius: 4px;
}

.pc-cashier__corner--tr {
  top: -1px;
  right: -1px;
  border-left: none;
  border-bottom: none;
  border-top-right-radius: 4px;
}

.pc-cashier__corner--bl {
  bottom: -1px;
  left: -1px;
  border-right: none;
  border-top: none;
  border-bottom-left-radius: 4px;
}

.pc-cashier__corner--br {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
  border-bottom-right-radius: 4px;
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
  background: #5d9dfe;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(93, 157, 254, 0.3);
}

.pc-cashier__pay-btn:hover {
  background: #4a87e0;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(93, 157, 254, 0.4);
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
