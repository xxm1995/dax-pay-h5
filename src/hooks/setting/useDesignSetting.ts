import { computed } from 'vue'
import { useDesignSettingStore } from '@/store/modules/designSetting'

export function useDesignSetting() {
  const designStore = useDesignSettingStore()

  const getAppTheme = computed(() => designStore.appTheme)

  const getAppThemeList = computed(() => designStore.appThemeList)

  const getIsPageAnimate = computed(() => designStore.isPageAnimate)

  const getPageAnimateType = computed(() => designStore.pageAnimateType)

  return {
    getAppTheme,
    getAppThemeList,
    getIsPageAnimate,
    getPageAnimateType,
  }
}
