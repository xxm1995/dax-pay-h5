<script lang="ts" setup>
import type { UserProtocolContentResult } from '@/shared/api/types'
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { findDefaultProtocol, resolveProtocolCode } from '@/shared/api/protocol'
import BeianFooter from '@/shared/components/BeianFooter.vue'
import { formatDate } from '@/shared/utils/datetime'

defineOptions({ name: 'PcProtocolPage' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const loading = ref(true)
const protocol = ref<UserProtocolContentResult | null>(null)
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
  <div class="pc-protocol">
    <header class="pc-protocol__bar">
      <button type="button" class="pc-protocol__back" @click="onBack">
        <span class="pc-protocol__arrow">‹</span>
        {{ t('common.back') }}
      </button>
      <span class="pc-protocol__bar-title">{{ title }}</span>
    </header>
    <main class="pc-protocol__main">
      <div class="pc-protocol__container">
        <div v-if="loading" class="pc-protocol__status">
          {{ t('common.loading') }}
        </div>
        <div v-else-if="errorMsg" class="pc-protocol__status">
          {{ errorMsg }}
        </div>
        <article v-else-if="html" class="pc-protocol__article">
          <h1 class="pc-protocol__title">
            {{ protocol?.title }}
          </h1>
          <div class="pc-protocol__meta">
            <span v-if="protocol?.versionLabel">{{ t('protocol.version', { version: protocol.versionLabel }) }}</span>
            <span v-if="protocol?.effectiveTime">{{ t('protocol.effectiveTime', { time: formatDate(protocol.effectiveTime) }) }}</span>
          </div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="pc-protocol__content" v-html="html" />
        </article>
        <div v-else class="pc-protocol__status">
          {{ t('protocol.noContent') }}
        </div>
      </div>
      <!-- 平台备案信息(版权 + ICP + 公网安, 配置为空不渲染) -->
      <BeianFooter class="pc-protocol__beian" />
    </main>
  </div>
</template>

<style scoped lang="less">
// PC 端: 严格使用 scoped 原生 px + 媒体查询, 禁用 UnoCSS 长度原子类
.pc-protocol {
  min-height: 100vh;
  background: var(--h5-bg-page);
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.pc-protocol__bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 24px;
  background: var(--h5-bg-card);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.pc-protocol__back {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  border: none;
  background: transparent;
  color: #5d9dfe;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: var(--h5-bg-brand-soft);
  }
}

.pc-protocol__arrow {
  font-size: 20px;
  line-height: 1;
  margin-right: 2px;
}

.pc-protocol__bar-title {
  margin-left: auto;
  margin-right: auto;
  transform: translateX(-26px);
  font-size: 16px;
  font-weight: 600;
  color: var(--h5-text-primary);
}

.pc-protocol__main {
  flex: 1;
  padding: 32px 16px;
}

.pc-protocol__container {
  max-width: 820px;
  margin: 0 auto;
  background: var(--h5-bg-card);
  border-radius: 8px;
  padding: 48px 56px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
}

.pc-protocol__status {
  text-align: center;
  color: var(--h5-text-secondary);
  padding: 80px 0;
  font-size: 14px;
}

/* 平台备案栏: 正文容器下方弱化展示 */
.pc-protocol__beian {
  margin-top: 16px;
  opacity: 0.75;
}

.pc-protocol__title {
  margin: 0 0 12px;
  font-size: 26px;
  font-weight: 700;
  color: var(--h5-text-primary);
  text-align: center;
}

.pc-protocol__meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--h5-border);
  font-size: 13px;
  color: var(--h5-text-secondary);
}

// v-html 内容样式穿透
:deep(.pc-protocol__content) {
  font-size: 15px;
  line-height: 1.85;
  color: var(--h5-text-primary);
  word-break: break-word;

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 28px 0 14px;
    font-weight: 600;
    color: var(--h5-text-primary);
  }

  h1 {
    font-size: 22px;
  }
  h2 {
    font-size: 20px;
  }
  h3 {
    font-size: 18px;
  }
  h4 {
    font-size: 16px;
  }

  p {
    margin: 14px 0;
  }

  ul,
  ol {
    margin: 14px 0;
    padding-left: 24px;
  }

  li {
    margin: 6px 0;
  }

  blockquote {
    margin: 16px 0;
    padding: 12px 16px;
    border-left: 4px solid #5d9dfe;
    background: var(--h5-bg-muted);
    color: var(--h5-text-secondary);
  }

  table {
    width: 100%;
    margin: 16px 0;
    border-collapse: collapse;

    th,
    td {
      border: 1px solid var(--h5-border);
      padding: 10px 12px;
    }

    th {
      background: var(--h5-bg-muted);
    }
  }

  pre {
    margin: 16px 0;
    padding: 14px 16px;
    background: var(--h5-bg-muted);
    border-radius: 6px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.6;
  }

  code {
    background: var(--h5-bg-muted);
    padding: 2px 6px;
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

// 响应式: 窄屏收缩内边距
@media (max-width: 768px) {
  .pc-protocol__main {
    padding: 16px 8px;
  }

  .pc-protocol__container {
    padding: 24px 20px;
  }
}
</style>
