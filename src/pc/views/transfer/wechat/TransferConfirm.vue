<script lang="ts" setup>
import type { TransferConfirmInfo } from '@/shared/api/transfer-confirm'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useRoute } from 'vue-router'
import { getTransferConfirmInfo } from '@/shared/api/transfer-confirm'

defineOptions({ name: 'PcTransferConfirm' })

const { t } = useI18n()
const route = useRoute()

const loading = ref(true)
// 加载是否失败(失败时不渲染金额等空数据)
const loadFailed = ref(false)
const info = ref<TransferConfirmInfo>({})

const amountYuan = computed(() => {
  const fen = info.value.amount ?? 0
  return (fen / 100).toFixed(2)
})

const isTerminal = computed(() => info.value.received === true)

const transferNo = route.params.transferNo as string

onMounted(async () => {
  if (!transferNo) {
    loading.value = false
    return
  }
  try {
    info.value = await getTransferConfirmInfo(transferNo)
  }
  catch {
    // 加载失败, 显示错误提示而非空数据
    loadFailed.value = true
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="pc-transfer-confirm">
    <div v-if="loading" class="pc-transfer-confirm__loading">
      {{ t('transferConfirm.loading') }}
    </div>
    <div v-else-if="loadFailed" class="pc-transfer-confirm__tip">
      {{ t('transferConfirm.loadFailed') }}
    </div>
    <template v-else>
      <!-- 金额 -->
      <div class="pc-transfer-confirm__amount">
        <span class="pc-transfer-confirm__currency">¥</span>
        <span class="pc-transfer-confirm__value">{{ amountYuan }}</span>
      </div>
      <!-- 转账信息 -->
      <div v-if="info.title" class="pc-transfer-confirm__title">
        {{ info.title }}
      </div>
      <!-- 引导提示 -->
      <div class="pc-transfer-confirm__tip">
        <template v-if="isTerminal">
          {{ t('transferConfirm.completed') }}
        </template>
        <template v-else>
          {{ t('transferConfirm.openInWechat') }}
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped lang="less">
.pc-transfer-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f5f5f5;
  padding: 48px 24px;

  &__loading {
    color: #888;
    font-size: 16px;
  }

  &__amount {
    display: flex;
    align-items: baseline;
    margin-bottom: 16px;
  }

  &__currency {
    font-size: 28px;
    font-weight: 600;
    color: #333;
    margin-right: 4px;
  }

  &__value {
    font-size: 56px;
    font-weight: 600;
    color: #333;
    line-height: 1;
  }

  &__title {
    font-size: 18px;
    color: #555;
    margin-bottom: 32px;
  }

  &__tip {
    font-size: 16px;
    color: #faad14;
    text-align: center;
    max-width: 400px;
  }
}
</style>
