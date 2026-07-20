<script lang="ts" setup>
import type { UserProtocolContentResult } from '@/shared/api/types'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findDefaultProtocol, resolveProtocolCode } from '@/shared/api/protocol'
import { formatDate } from '@/shared/utils/datetime'

defineOptions({ name: 'ProtocolPage' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// 加载中
const loading = ref(true)
// 协议内容
const protocol = ref<UserProtocolContentResult | null>(null)
// 错误信息
const errorMsg = ref('')

const title = computed(() => protocol.value?.title || t('protocol.title'))
const html = computed(() => protocol.value?.contentHtml || '')

/** 加载默认协议内容 */
async function load() {
  const raw = route.params.protocolType as string
  const code = resolveProtocolCode(raw)
  if (!code) {
    errorMsg.value = t('protocol.typeNotExist')
    loading.value = false
    return
  }
  try {
    protocol.value = await findDefaultProtocol(code)
  }
  catch (e) {
    errorMsg.value = e instanceof Error ? e.message : t('protocol.loadFailed')
  }
  finally {
    loading.value = false
  }
}

/** 返回上一页, 无历史则回首页 */
function onBack() {
  if (window.history.state?.back) {
    router.back()
  }
  else {
    router.replace('/')
  }
}

onMounted(load)
</script>

<template>
  <div class="protocol-page">
    <van-nav-bar :title="title" left-arrow safe-area-inset-top fixed @click-left="onBack" />
    <div class="protocol-body">
      <!-- 加载中 -->
      <div v-if="loading" class="protocol-loading">
        <van-loading type="spinner" size="36px">
          {{ t('common.loading') }}
        </van-loading>
      </div>

      <!-- 错误 -->
      <van-empty v-else-if="errorMsg" :description="errorMsg" />

      <!-- 正文 -->
      <template v-else-if="html">
        <h1 class="protocol-title">
          {{ protocol?.title }}
        </h1>
        <div class="protocol-meta">
          <span v-if="protocol?.versionLabel">{{ t('protocol.version', { version: protocol.versionLabel }) }}</span>
          <span v-if="protocol?.effectiveTime">{{ t('protocol.effectiveTime', { time: formatDate(protocol.effectiveTime) }) }}</span>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div class="protocol-content" v-html="html" />
      </template>

      <!-- 无内容 -->
      <van-empty v-else :description="t('protocol.noContent')" />
    </div>
  </div>
</template>

<style scoped lang="less">
.protocol-page {
  // 父级 RouterView flex-1 已分配全高；用 height: 100% 严格锁定，配合 body overflow:hidden 不外溢
  height: 100%;
  background: var(--h5-bg-card);
  // 留出固定导航栏高度
  padding-top: 46px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.protocol-body {
  // 内部滚动容器：正文超长时自滚，不冒泡到 body
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
  // 长文阅读行高优化
  font-size: 15px;
  line-height: 1.7;
  color: var(--h5-text-primary);
  word-break: break-word;
}

.protocol-loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.protocol-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: var(--h5-text-primary);
  text-align: center;
}

.protocol-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--h5-border);
  font-size: 12px;
  color: var(--h5-text-secondary);
}

// v-html 内容样式穿透
:deep(.protocol-content) {
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 20px 0 10px;
    font-weight: 600;
    color: var(--h5-text-primary);
  }

  h1 {
    font-size: 20px;
  }
  h2 {
    font-size: 18px;
  }
  h3 {
    font-size: 17px;
  }

  p {
    margin: 12px 0;
  }

  ul,
  ol {
    margin: 12px 0;
    padding-left: 22px;
  }

  li {
    margin: 4px 0;
  }

  blockquote {
    margin: 12px 0;
    padding: 8px 12px;
    border-left: 3px solid #5d9dfe;
    background: var(--h5-bg-muted);
    color: var(--h5-text-secondary);
  }

  table {
    width: 100%;
    margin: 12px 0;
    border-collapse: collapse;

    th,
    td {
      border: 1px solid var(--h5-border);
      padding: 8px;
    }

    th {
      background: var(--h5-bg-muted);
    }
  }

  pre {
    margin: 12px 0;
    padding: 12px;
    background: var(--h5-bg-muted);
    border-radius: 6px;
    overflow-x: auto;
    font-size: 13px;
  }

  code {
    background: var(--h5-bg-muted);
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 13px;
  }

  img {
    max-width: 100%;
  }

  a {
    color: #5d9dfe;
  }
}
</style>
