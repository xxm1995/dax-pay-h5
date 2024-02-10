/**
 * 关闭浏览器
 */
export function closeBrowser() {
  const ua = navigator.userAgent
  if (ua.indexOf('Firefox') != -1 || ua.indexOf('Chrome') != -1) {
    window.location.href = 'about:blank'
    window.close()
  }
  // 微信浏览器关闭页面
  else {
    // @ts-ignore
    if (ua.toLowerCase().match(/micromessenger/i) == 'micromessenger') {
      // @ts-ignore
      WeixinJSBridge.call('closeWindow')
    } else {
      window.opener = null
      window.open('', '_self')
      window.close()
    }
  }
}
