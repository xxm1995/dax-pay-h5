/**
 * 通用响应类
 */
export interface Result<T = any> {
  code: number
  type: 'success' | 'error' | 'warning'
  msg: string
  traceId: string | null | undefined
  data: T
}

/**
 * 分页响应类
 */
export interface PageResult<T = any> {
  current: number
  records: Array<T>
  size: number
  total: number
}
