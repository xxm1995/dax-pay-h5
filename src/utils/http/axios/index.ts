// axios配置  可自行根据项目进行更改，只需更改该文件即可，其他文件可以不动
import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { showDialog, showFailToast } from 'vant'
import { VAxios } from './Axios'
import type { AxiosTransform } from './axiosTransform'
import { checkStatus } from './checkStatus'
import { formatRequestDate, joinTimestamp } from './helper'
import type { CreateAxiosOptions, RequestOptions } from './types'
import { ContentTypeEnum, RequestEnum, ResultEnum } from '@/enums/httpEnum'
import { PageEnum } from '@/enums/pageEnum'
import { useGlobSetting } from '@/hooks/setting'

import { isString } from '@/utils/is/'
import { deepMerge, isUrl } from '@/utils'
import { setObjToUrlParams } from '@/utils/urlUtils'

import router from '@/router'
import { storage } from '@/utils/Storage'
import type { Result } from '#/axios'

const globSetting = useGlobSetting()
const urlPrefix = globSetting.urlPrefix

/**
 * @description: 数据处理，方便区分多种处理方式
 */
const transform: AxiosTransform = {
  /**
   * @description: 处理请求数据
   */
  // eslint-disable-next-line ts/ban-ts-comment
  // @ts-expect-error
  transformRequestData: (res: AxiosResponse<Result>, options: RequestOptions) => {
    const {
      isShowMessage = true,
      isShowErrorMessage,
      isShowSuccessMessage,
      successMessageText,
      errorMessageText,
      isTransformResponse,
      isReturnNativeResponse,
    } = options

    // 是否返回原生响应头 比如：需要获取响应头时使用该属性
    if (isReturnNativeResponse) {
      return res
    }

    // 不进行任何处理，直接返回
    // 用于页面代码可能需要直接获取code，data，message这些信息时开启
    if (!isTransformResponse) {
      return res.data
    }

    const { data: result } = res
    if (!result) {
      // return '[HTTP] Request has no return value';
      throw new Error('请求出错，请稍候重试')
    }
    //  这里 code，result，message为 后台统一的字段，需要修改为项目自己的接口返回格式
    const { code, msg, data } = result
    // 请求成功
    const hasSuccess = result && Reflect.has(result, 'code') && code === ResultEnum.SUCCESS
    // 是否显示提示信息
    if (isShowMessage) {
      if (hasSuccess && (successMessageText || isShowSuccessMessage)) {
        showDialog({
          message: successMessageText || msg || '操作成功！',
        }).then(() => {
          // on close
        })
      }
      else if (!hasSuccess && (errorMessageText || isShowErrorMessage)) {
        // 是否显示自定义信息提示
        showFailToast(msg || errorMessageText || '操作失败！')
      }
      else if (!hasSuccess && options.errorMessageMode === 'modal') {
        // errorMessageMode=‘custom-modal’的时候会显示modal错误弹窗，而不是消息提示，用于一些比较重要的错误
        showDialog({
          title: '提示',
          message: msg,
        }).then(() => {
          // on close
        })
      }
    }

    // 接口请求成功，直接返回相应结果
    if (code === ResultEnum.SUCCESS) {
      return result
    }
    // 接口请求错误，统一提示错误信息 这里逻辑可以根据项目进行修改
    const errorMsg = msg

    // 请求失败
    console.log(code)
    if (code) {
      showFailToast(errorMsg)
    }
    throw new Error(errorMsg)
  },

  // 请求之前处理config
  beforeRequestHook: (config, options) => {
    const { apiUrl, joinPrefix, joinParamsToUrl, formatDate, joinTime = true, urlPrefix } = options
    const isUrlStr = isUrl(config.url as string)

    if (!isUrlStr && joinPrefix) {
      config.url = `${urlPrefix}${config.url}`
    }

    if (!isUrlStr && apiUrl && isString(apiUrl)) {
      config.url = `${apiUrl}${config.url}`
    }
    const params = config.params || {}
    const data = config.data || false
    if (config.method?.toUpperCase() === RequestEnum.GET) {
      if (!isString(params)) {
        // 给 get 请求加上时间戳参数，避免从缓存中拿数据。
        config.params = Object.assign(params || {}, joinTimestamp(joinTime, false))
      }
      else {
        // 兼容restful风格
        config.url = `${config.url + params}${joinTimestamp(joinTime, true)}`
        config.params = undefined
      }
    }
    else {
      if (!isString(params)) {
        formatDate && formatRequestDate(params)
        if (
          Reflect.has(config, 'data')
          && config.data
          && (Object.keys(config.data).length > 0 || config.data instanceof FormData)
        ) {
          config.data = data
          config.params = params
        }
        else {
          config.data = data
          // params 是添加到 url 的请求字符串中的，用于 get 请求
          config.params = params
        }
        if (joinParamsToUrl) {
          config.url = setObjToUrlParams(
            config.url as string,
            { ...config.params, ...config.data },
          )
        }
      }
      else {
        // 兼容restful风格
        config.url = config.url + params
        config.params = undefined
      }
    }
    return config
  },

  /**
   * @description: 响应错误处理
   */
  responseInterceptorsCatch: (error: any) => {
    const { response, code, message } = error || {}
    // TODO 此处要根据后端接口返回格式修改
    const msg: string
      = response && response.data && response.data.message ? response.data.message : ''
    const err: string = error.toString()
    try {
      if (code === 'ECONNABORTED' && message.includes('timeout')) {
        showFailToast('接口请求超时，请刷新页面重试!')
        return
      }
      if (err && err.includes('Network Error')) {
        showDialog({
          title: '网络异常',
          message: '请检查您的网络连接是否正常',
        })
          .then(() => {})
          .catch(() => {})
        return Promise.reject(error)
      }
    }
    catch (error) {
      console.log(error)
      throw new Error(error as any)
    }
    // 请求是否被取消
    const isCancel = axios.isCancel(error)
    if (!isCancel) {
      checkStatus(error.response && error.response.status, msg)
    }
    else {
      console.warn(error, '请求被取消！')
    }
    // return Promise.reject(error);
    return Promise.reject(response?.data)
  },
}

function createAxios(opt?: Partial<CreateAxiosOptions>) {
  return new VAxios(
    deepMerge(
      {
        timeout: 10 * 1000,
        authenticationScheme: '',
        // 接口前缀
        prefixUrl: urlPrefix,

        // 如果是json格式
        headers: { 'Content-Type': ContentTypeEnum.JSON },
        // headers: { 'Content-Type': ContentTypeEnum.FORM_URLENCODED },

        // 数据处理方式
        transform,
        // 配置项，下面的选项都可以在独立的接口请求中覆盖
        requestOptions: {
          // 默认将prefix 添加到url
          joinPrefix: true,
          // 是否返回原生响应头 比如：需要获取响应头时使用该属性
          isReturnNativeResponse: false,
          // 需要对返回数据进行处理
          isTransformResponse: true,
          // post请求的时候添加参数到url
          joinParamsToUrl: false,
          // 格式化提交参数时间
          formatDate: true,
          // 消息提示类型
          errorMessageMode: 'none',
          // 接口地址
          apiUrl: globSetting.apiUrl,
          // 接口拼接地址
          urlPrefix,
          //  是否加入时间戳
          joinTime: true,
          // 忽略重复请求
          ignoreCancelToken: true,
          // 是否携带token
          withToken: true,
        },
        withCredentials: false,
      },
      opt || {},
    ),
  )
}

export const http = createAxios()

// 项目，多个不同 api 地址，直接在这里导出多个
// src/api ts 里面接口，就可以单独使用这个请求，
// import { httpTwo } from '@/utils/http/axios'
// export const httpTwo = createAxios({
//   requestOptions: {
//     apiUrl: 'http://localhost:9001',
//     urlPrefix: 'api',
//   },
// });
