import { createApp } from 'vue'
import MobileApp from '@/mobile/App.vue'
import router, { setupRouter } from '@/mobile/router'
import { setupStore } from '@/shared/store'
import { useDesignSettingWithOut } from '@/shared/store/modules/designSetting'
import 'vant/es/toast/style'

import 'vant/es/dialog/style'
import 'vant/es/notify/style'
import 'vant/es/image-preview/style'
// Register icon sprite
import 'virtual:svg-icons-register'

// 开发环境启用 vconsole 移动端调试面板（由 VITE_V_CONSOLE 控制，默认开启）
if (import.meta.env.DEV && import.meta.env.VITE_V_CONSOLE !== 'false') {
  import('vconsole').then(({ default: VConsole }) => {
    // eslint-disable-next-line no-new -- vconsole 以副作用方式实例化以挂载调试面板
    new VConsole()
  })
}

/**
 * 创建移动端应用实例
 * 挂载点：#app（受 postcss-mobile-forever 的 appSelector 限宽 600px 居中）
 */
export async function createMobileApp() {
  const app = createApp(MobileApp)
  // 挂载状态管理
  setupStore(app)
  // 初始化全局主题：跟随系统 prefers-color-scheme（不支持手动修改）
  useDesignSettingWithOut().initSystemListener()
  // 挂载路由
  setupRouter(app)
  await router.isReady()
  return app
}
