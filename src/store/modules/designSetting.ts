import { defineStore } from 'pinia'
import { store } from '@/store'
import designSetting from '@/settings/designSetting'
import type { DesignSettingState } from '@/settings/designSetting'

const {  appTheme, appThemeList, isPageAnimate, pageAnimateType } = designSetting

export const useDesignSettingStore = defineStore({
  id: 'app-design-setting',
  state: (): DesignSettingState => ({
    appTheme,
    appThemeList,
    isPageAnimate,
    pageAnimateType,
  }),
  getters: {
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
    setPageAnimateType(type: string): void {
      this.pageAnimateType = type
    },
  },
  // 持久化
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'DESIGN-SETTING',
        storage: localStorage,
      },
    ],
  },
})

// Need to be used outside the setup
export function useDesignSettingWithOut() {
  return useDesignSettingStore(store)
}
