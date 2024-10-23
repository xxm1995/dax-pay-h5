export interface GlobConfig {
  title: string
  titleCN: string
  apiUrl: string
  shortName: string
  urlPrefix?: string
}

export interface GlobEnvConfig {
  // 标题
  VITE_GLOB_APP_TITLE: string
  // 中文标题
  VITE_GLOB_APP_TITLE_CN: string
  // 接口地址
  VITE_GLOB_API_URL: string
  // 接口前缀
  VITE_GLOB_API_URL_PREFIX?: string
  //项目简称
  VITE_GLOB_APP_SHORT_NAME: string
}
