import { http } from '@/utils/http/axios'
import type { Result } from '#/axios'

/**
 * 通过key获取信息路由信息
 */
export function getRouterByKey(key: string): Promise<Result<RouterInfo>> {
  return http.request({
    url: '/short/link/getRouterByKey',
    method: 'get',
    params: { key },
  })
}

/**
 * 路由信息
 */
interface RouterInfo {
  // key值
  key: string
  // 路由键
  route: string
  // 数据信息
  data: string
}
