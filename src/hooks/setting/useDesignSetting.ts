import { computed } from 'vue'
import { useDesignSettingStore } from '@/store/modules/designSetting'

export function useDesignSetting() {
  const designStore = useDesignSettingStore()

  // 当前实际生效主题（跟随系统 prefers-color-scheme 派生）
  const getDarkMode = computed(() => designStore.getDarkMode)

  const getAppTheme = computed(() => designStore.appTheme)

  const getAppThemeList = computed(() => designStore.appThemeList)

  const getIsPageAnimate = computed(() => designStore.isPageAnimate)

  const getPageAnimateType = computed(() => designStore.pageAnimateType)

  return {
    getDarkMode,
    getAppTheme,
    getAppThemeList,
    getIsPageAnimate,
    getPageAnimateType,
  }
}
