import { createMobileApp } from '@/mobile/app'
import { createPCApp } from '@/pc/app'
// UnoCSS 全局样式与重置在入口统一导入一次，PC/移动端共用
import 'virtual:uno.css'
// https://unocss.dev/guide/style-reset#tailwind-compat
// 此重置基于 Tailwind 重置，减去按钮的背景颜色覆盖，以避免与 UI 框架发生冲突。
import '@unocss/reset/tailwind-compat.css'

/**
 * 应用入口分发器
 *
 * 由 index.html 内联脚本在 Vue 挂载前写入 window.__DEVICE__（'pc' | 'mobile'），
 * 此处据此挂载对应应用，首屏即为正确设备 UI，无重定向、无布局闪烁。
 * - mobile → 挂载到 #app（受 postcss-mobile-forever 限宽 600px 居中）
 * - pc     → 挂载到 #pc-app（全宽，px 不被转 vw）
 */
async function bootstrap() {
  const isPC = window.__DEVICE__ === 'pc'
  const app = isPC ? await createPCApp() : await createMobileApp()
  app.mount(isPC ? '#pc-app' : '#app', true)
}

void bootstrap()
