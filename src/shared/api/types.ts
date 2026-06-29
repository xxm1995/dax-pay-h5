// 协议内容(对应后端 UserProtocolContentResult)
// 注意: id 字段统一用 string, 避免 number 精度丢失
export interface UserProtocolContentResult {
  // 主键ID
  id?: string
  // 名称
  name?: string
  // 显示名称
  showName?: string
  // 协议类型(USER_AGREEMENT/PRIVACY_POLICY)
  type?: string
  // 端类型(WEB/APP/MINIAPP)
  clientType?: string
  // 语言
  language?: string
  // 版本号
  versionNo?: number
  // 版本标签(如 v1.0.0)
  versionLabel?: string
  // 标题
  title?: string
  // 协议内容(Markdown 源文)
  content?: string
  // 渲染后的HTML(前端直接 v-html 渲染)
  contentHtml?: string
  // 内容格式
  contentFormat?: string
  // 生效时间(ISO 8601 字符串)
  effectiveTime?: string
}
