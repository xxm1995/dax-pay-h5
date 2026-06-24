<script setup lang="ts">
import { useDesignSetting } from '@/shared/hooks/setting/useDesignSetting'
import { useRouteStore } from '@/shared/store/modules/route'
import { darken, lighten } from '@/shared/utils'

const routeStore = useRouteStore()
const { getDarkMode, getAppTheme, getIsPageAnimate, getPageAnimateType } = useDesignSetting()

// 需要缓存的路由组件
const keepAliveComponents = computed(() => routeStore.keepAliveComponents)

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

const getTransitionName = computed(() => {
  return unref(getIsPageAnimate) ? unref(getPageAnimateType) : undefined
})
</script>

<template>
  <vanConfigProvider :theme="getDarkMode" :theme-vars="getThemeVars()">
    <RouterView v-slot="{ Component }">
      <div class="absolute bottom-0 top-0 w-full overflow-hidden">
        <transition :name="getTransitionName" mode="out-in" appear>
          <KeepAlive v-if="keepAliveComponents" :include="keepAliveComponents">
            <component :is="Component" />
          </KeepAlive>
        </transition>
      </div>
    </RouterView>
  </vanConfigProvider>
</template>

<style lang="less">
  @import '../shared/styles/index.less';
</style>
