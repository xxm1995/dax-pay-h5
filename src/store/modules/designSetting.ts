import type { DesignSettingState } from '@/settings/designSetting'
import { defineStore } from 'pinia'
import designSetting from '@/settings/designSetting'
import { store } from '@/store'

const { systemPrefersDark, appTheme, appThemeList, isPageAnimate, pageAnimateType } = designSetting

// 是否已绑定系统主题监听，避免重复绑定
let systemListenerBound = false

/** 同步 <html> 的 dark / light class，驱动全局深色样式（common.less 的 html.dark / html.light） */
function syncHtmlThemeClass(isDark: boolean) {
  const html = document.documentElement
  html.classList.toggle('dark', isDark)
  html.classList.toggle('light', !isDark)
}

export const useDesignSettingStore = defineStore('app-design-setting', {
  state: (): DesignSettingState => ({
    systemPrefersDark,
    appTheme,
    appThemeList,
    isPageAnimate,
    pageAnimateType,
  }),
  getters: {
    // 当前实际生效的主题（跟随系统 prefers-color-scheme）
    getDarkMode(): 'light' | 'dark' {
      return this.systemPrefersDark ? 'dark' : 'light'
    },
    getAppTheme(): string {
      return this.appTheme
    },
    getAppThemeList(): string[] {
      return this.appThemeList
    },
    getIsPageAnimate(): boolean {
      return this.isPageAnimate
    },
    getPageAnimateType(): string {
      return this.pageAnimateType
    },
  },
  actions: {
    /**
     * 初始化系统主题监听：读取 prefers-color-scheme 并监听其变化
     * 全局跟随系统，不支持手动修改
     */
    initSystemListener() {
      // 非浏览器环境（如 SSR）仅按当前 state 同步一次
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        syncHtmlThemeClass(this.systemPrefersDark)
        return
      }
      // 首次读取系统主题并同步到 <html>
      this.systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      syncHtmlThemeClass(this.systemPrefersDark)
      // 已绑定过则不再重复添加监听（应用生命周期内常驻）
      if (systemListenerBound) {
        return
      }
      systemListenerBound = true
      const mql = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        this.systemPrefersDark = e.matches
        syncHtmlThemeClass(this.systemPrefersDark)
      }
      mql.addEventListener('change', handler)
    },
    setPageAnimateType(type: string): void {
      this.pageAnimateType = type
    },
  },
  // 仅持久化用户可配置项，跟随系统的 systemPrefersDark 不持久化
  persist: {
    key: 'DESIGN-SETTING',
    storage: localStorage,
    pick: ['appTheme', 'appThemeList', 'isPageAnimate', 'pageAnimateType'],
  },
})

// Need to be used outside the setup
export function useDesignSettingWithOut() {
  return useDesignSettingStore(store)
}
