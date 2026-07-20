<script lang="ts" setup>
/**
 * 订单卡骨架屏
 *
 * 在订单数据加载完成前展示，视觉上比纯转圈更平滑，减少「空白 → 内容」的跳跃感。
 * 模拟聚合/收银订单卡的视觉结构：顶部品牌色横条 + 上浮白卡（标题 / 金额 / 元信息行）。
 */
defineOptions({ name: 'OrderCardSkeleton' })
</script>

<template>
  <div class="order-skeleton">
    <!-- 顶部品牌色横条（与业务页 agg__brand / cashier__header 对齐） -->
    <div class="order-skeleton__brand" />

    <!-- 上浮白卡 -->
    <div class="order-skeleton__card">
      <!-- 标题占位 -->
      <div class="order-skeleton__line order-skeleton__line--title" />
      <!-- 金额占位 -->
      <div class="order-skeleton__line order-skeleton__line--amount" />
      <!-- 元信息分隔 -->
      <div class="order-skeleton__meta">
        <div class="order-skeleton__line order-skeleton__line--meta" />
        <div class="order-skeleton__line order-skeleton__line--meta order-skeleton__line--short" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-skeleton {
  min-height: 100%;
  background: var(--h5-bg-page, #f7f8fa);
}

.order-skeleton__brand {
  height: 130px;
  background: var(--app-theme-color, #5d9dfe);
  opacity: 0.6;
}

.order-skeleton__card {
  position: relative;
  z-index: 1;
  margin: -32px 16px 16px;
  padding: 24px 20px;
  background: var(--h5-bg-card, #fff);
  border-radius: 12px;
  box-shadow: var(--h5-shadow-card, 0 2px 12px rgb(0 0 0 / 5%));
  text-align: center;
}

/* shimmer 占位条 */
.order-skeleton__line {
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--h5-bg-muted, #f0f0f0) 25%,
    var(--h5-bg-card, #e5e5e5) 37%,
    var(--h5-bg-muted, #f0f0f0) 63%
  );
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
}

.order-skeleton__line--title {
  height: 16px;
  width: 40%;
  margin: 0 auto 16px;
}

.order-skeleton__line--amount {
  height: 36px;
  width: 50%;
  margin: 0 auto 24px;
}

.order-skeleton__meta {
  border-top: 1px solid var(--h5-border, #f0f0f0);
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.order-skeleton__line--meta {
  height: 12px;
  width: 100%;
}

.order-skeleton__line--short {
  width: 60%;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>
