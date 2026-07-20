import { unref } from 'vue'
import { useDesignSetting } from '@/shared/hooks/setting/useDesignSetting'
import { darken, lighten } from '@/shared/utils'

/**
 * Vant ConfigProvider 主题变量（主色跟随 appTheme）
 * 移动端 / PC 共用，避免两端各写一份
 */
export function useVantThemeVars() {
  const { getDarkMode, getAppTheme } = useDesignSetting()

  function getThemeVars() {
    const appTheme = unref(getAppTheme)
    const darkenStr = darken(appTheme, 25)
    const lightenStr = lighten(appTheme, 10)

    return {
      actionSheetCancelTextColor: appTheme,
      buttonPrimaryBackground: appTheme,
      buttonPrimaryBorderColor: appTheme,
      radioCheckedIconColor: appTheme,
      sliderActiveBackground: appTheme,
      cascaderActiveColor: appTheme,
      checkboxCheckedIconColor: appTheme,
      numberKeyboardButtonBackground: appTheme,
      pickerLoadingIconColor: appTheme,
      calendarRangeEdgeBackground: appTheme,
      calendarRangeMiddleColor: appTheme,
      calendarSelectedDayBackground: appTheme,
      stepperButtonRoundThemeColor: appTheme,
      switchOnBackground: appTheme,
      dialogConfirmButtonTextColor: appTheme,
      dropdownMenuOptionActiveColor: appTheme,
      dropdownMenuTitleActiveTextColor: appTheme,
      notifyPrimaryBackground: appTheme,
      circleColor: appTheme,
      noticeBarBackground: lightenStr,
      noticeBarTextColor: darkenStr,
      progressColor: appTheme,
      progressPivotBackground: appTheme,
      stepActiveColor: appTheme,
      stepFinishLineColor: appTheme,
      swipeIndicatorActiveBackground: appTheme,
      tagPrimaryColor: appTheme,
      navBarIconColor: appTheme,
      navBarTextColor: appTheme,
      paginationItemDefaultColor: appTheme,
      sidebarSelectedBorderColor: appTheme,
      tabsDefaultColor: appTheme,
      tabsBottomBarColor: appTheme,
      tabbarItemActiveColor: appTheme,
      treeSelectItemActiveColor: appTheme,
    }
  }

  return {
    getDarkMode,
    getThemeVars,
  }
}
