import presetRemToPx from '@unocss/preset-rem-to-px'
import transformerDirectives from '@unocss/transformer-directives'
import transformerVariantGroup from '@unocss/transformer-variant-group'
import {
  defineConfig,
  presetUno,
} from 'unocss'

export default defineConfig({
  // ...UnoCSS options
  presets: [
    // 此预设尝试提供流行的实用程序优先框架的通用超集，包括 Tailwind CSS、Windy CSS、Bootstrap、Tachyons 等
    presetUno(),

    // 模板使用 viewport 作为移动端适配方案，unocss 默认单位为 rem
    // 所以需要转成 px，然后由 postcss 把 px 转成 vw/vh，完成适配
    // https://unocss.dev/presets/rem-to-px
    presetRemToPx({
      // default
      baseFontSize: 16,
    }),
  ],
  transformers: [
    // 启用 Windi CSS for UnoCSS 的变体组功能(就是简写，具体看链接): https://unocss.dev/transformers/variant-group#usage
    transformerVariantGroup(),
    // 在样式类里你也可以写原子化 css 具体看链接: https://unocss.dev/transformers/directives#usage
    // Unknown at rule @apply: https://github.com/unocss/unocss/issues/2401
    transformerDirectives(),
  ],

  // 一些实用的自定义组合
  shortcuts: {
    'm-0-auto': 'm-0 ma', // margin: 0 auto
    'wh-full': 'w-full h-full', // width: 100%, height: 100%
    'flex-center': 'flex justify-center items-center', // flex布局居中
    'flex-x-center': 'flex justify-center', // flex布局：主轴居中
    'flex-y-center': 'flex items-center', // flex布局：交叉轴居中
    'text-overflow': 'overflow-hidden whitespace-nowrap text-ellipsis', // 文本溢出显示省略号
    'text-break': 'whitespace-normal break-all break-words', // 文本溢出换行
  },
})
