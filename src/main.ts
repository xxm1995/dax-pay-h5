import { createApp } from 'vue'
import { setupStore } from '@/store'
import { useDesignSettingWithOut } from '@/store/modules/designSetting'
import App from './App.vue'
import router, { setupRouter } from './router'
import 'virtual:uno.css'

import 'vant/es/toast/style'

import 'vant/es/dialog/style'
import 'vant/es/notify/style'
import 'vant/es/image-preview/style'
// https://unocss.dev/guide/style-reset#tailwind-compat
// 此重置基于 Tailwind 重置，减去按钮的背景颜色覆盖，以避免与 UI 框架发生冲突。请参阅链接的问题。
import '@unocss/reset/tailwind-compat.css'
// Register icon sprite
import 'virtual:svg-icons-register'

// 开发环境启用 vconsole 移动端调试面板（由 VITE_V_CONSOLE 控制，默认开启）
if (import.meta.env.DEV && import.meta.env.VITE_V_CONSOLE !== 'false') {
  import('vconsole').then(({ default: VConsole }) => {
    // eslint-disable-next-line no-new -- vconsole 以副作用方式实例化以挂载调试面板
    new VConsole()
  })
}

async function bootstrap() {
  const app = createApp(App)
  // 挂载状态管理
  setupStore(app)
  // 初始化全局主题：跟随系统 prefers-color-scheme（不支持手动修改）
  useDesignSettingWithOut().initSystemListener()
  // 挂载路由
  setupRouter(app)
  await router.isReady()
  // 路由准备就绪后挂载APP实例
  app.mount('#app', true)
}

void bootstrap()
