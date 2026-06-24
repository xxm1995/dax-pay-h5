<script lang="ts" setup>
import { computed } from 'vue'

defineOptions({ name: 'MerchantStatement' })

interface Trade {
  time: string
  orderNo: string
  title: string
  amount: number
  channel: '微信' | '支付宝' | '银联'
  status: '成功' | '失败' | '处理中'
}

// 演示交易流水（mock）
const trades: Trade[] = [
  { time: '2026-06-24 10:23:11', orderNo: 'DEMO20260624102311001', title: '会员订阅', amount: 99.00, channel: '微信', status: '成功' },
  { time: '2026-06-24 09:48:32', orderNo: 'DEMO20260624094832002', title: '商品订单', amount: 158.50, channel: '支付宝', status: '成功' },
  { time: '2026-06-24 09:12:05', orderNo: 'DEMO20260624091205003', title: '虚拟商品', amount: 12.00, channel: '微信', status: '处理中' },
  { time: '2026-06-23 22:01:47', orderNo: 'DEMO20260623220147004', title: '服务费', amount: 300.00, channel: '银联', status: '成功' },
  { time: '2026-06-23 18:34:20', orderNo: 'DEMO20260623183420005', title: '商品订单', amount: 46.80, channel: '支付宝', status: '失败' },
  { time: '2026-06-23 15:09:56', orderNo: 'DEMO20260623150956006', title: '会员订阅', amount: 99.00, channel: '微信', status: '成功' },
  { time: '2026-06-23 11:42:13', orderNo: 'DEMO20260623114213007', title: '虚拟商品', amount: 6.00, channel: '微信', status: '成功' },
  { time: '2026-06-23 08:55:30', orderNo: 'DEMO20260623085530008', title: '商品订单', amount: 218.00, channel: '支付宝', status: '成功' },
]

// 汇总
const summary = computed(() => {
  const success = trades.filter(t => t.status === '成功')
  const totalAmount = success.reduce((sum, t) => sum + t.amount, 0)
  const successRate = trades.length ? (success.length / trades.length) * 100 : 0
  return {
    totalAmount: totalAmount.toFixed(2),
    count: trades.length,
    successRate: successRate.toFixed(1),
  }
})

// 状态对应样式类
function statusClass(status: Trade['status']) {
  return { 成功: 'is-success', 失败: 'is-fail', 处理中: 'is-pending' }[status]
}
</script>

<template>
  <div class="statement">
    <h1 class="statement__heading">
      商户对账单
    </h1>

    <!-- 汇总卡片 -->
    <div class="statement__summary">
      <div class="statement__summary-card">
        <span class="statement__summary-label">交易总额（成功）</span>
        <span class="statement__summary-value">￥{{ summary.totalAmount }}</span>
      </div>
      <div class="statement__summary-card">
        <span class="statement__summary-label">交易笔数</span>
        <span class="statement__summary-value">{{ summary.count }}</span>
      </div>
      <div class="statement__summary-card">
        <span class="statement__summary-label">支付成功率</span>
        <span class="statement__summary-value">{{ summary.successRate }}%</span>
      </div>
    </div>

    <!-- 流水表格 -->
    <div class="statement__table-wrap">
      <table class="statement__table">
        <thead>
          <tr>
            <th>交易时间</th>
            <th>订单号</th>
            <th>商品标题</th>
            <th>金额</th>
            <th>支付通道</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in trades" :key="t.orderNo">
            <td>{{ t.time }}</td>
            <td class="statement__mono">
              {{ t.orderNo }}
            </td>
            <td>{{ t.title }}</td>
            <td class="statement__amount">
              ￥{{ t.amount.toFixed(2) }}
            </td>
            <td>{{ t.channel }}</td>
            <td><span class="statement__status" :class="statusClass(t.status)">{{ t.status }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* PC 端对账单：scoped 原生 px + 媒体查询，不使用 UnoCSS 的 px 原子类 */
.statement {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px;
  box-sizing: border-box;
}

.statement__heading {
  font-size: 24px;
  font-weight: 700;
  color: #1d2129;
  margin: 0 0 24px;
}

.statement__summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.statement__summary-card {
  background: #ffffff;
  border-radius: 8px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #ebedf0;
}

.statement__summary-label {
  font-size: 13px;
  color: #86909c;
}

.statement__summary-value {
  font-size: 26px;
  font-weight: 700;
  color: #1d2129;
}

.statement__table-wrap {
  background: #ffffff;
  border-radius: 8px;
  overflow-x: auto;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #ebedf0;
}

.statement__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.statement__table thead th {
  text-align: left;
  padding: 14px 16px;
  color: #86909c;
  font-weight: 500;
  background: #f7f8fa;
  border-bottom: 1px solid #ebedf0;
  white-space: nowrap;
}

.statement__table tbody td {
  padding: 14px 16px;
  color: #1d2129;
  border-bottom: 1px solid #f2f3f5;
}

.statement__table tbody tr:last-child td {
  border-bottom: none;
}

.statement__table tbody tr:hover {
  background: #f7f8fa;
}

.statement__mono {
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
}

.statement__amount {
  font-weight: 600;
}

.statement__status {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.6;
}

.statement__status.is-success {
  color: #00b42a;
  background: #e8ffea;
}

.statement__status.is-fail {
  color: #f53f3f;
  background: #ffece8;
}

.statement__status.is-pending {
  color: #ff7d00;
  background: #fff7e8;
}

@media (max-width: 768px) {
  .statement {
    padding: 16px;
  }

  .statement__summary {
    grid-template-columns: 1fr;
  }
}
</style>
