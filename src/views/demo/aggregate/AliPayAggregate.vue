<template>
  <div class="flex flex-col justify-center page-container">
    <van-overlay lock-scroll :show="loading">
      <Loading text="调起支付中..." />
    </van-overlay>
    <div class="text-center">
      <h1>金额: {{ info.amount / 100.0 }} 元</h1>
      <h1>标题: {{ info.title }}</h1>
      <h1>业务号: {{ info.businessNo }}</h1>
    </div>
    <div class="text-center">
      <van-button type="primary" @click="pay">去支付</van-button>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { onMounted, ref, unref } from 'vue'
  import { AggregatePayInfo, aliH5Pay, getInfo } from './Aggregate.api'
  import { useRouter } from 'vue-router'
  import router from '@/router'
  import Loading from '@/components/Loading/Loading.vue'

  onMounted(() => {
    init()
  })

  const { currentRoute } = useRouter()
  const { query } = unref(currentRoute)

  const loading = ref<boolean>(false)
  const code = ref<string>(query.code as string)
  const info = ref<AggregatePayInfo>({})

  /**
   * 根据code获取支付信息
   */
  function init() {
    loading.value = true
    getInfo(code.value)
      .then(({ data }) => {
        info.value = data
        loading.value = false
      })
      .catch((err) => {
        // 跳转到错误页
        router.push({
          name: 'PayErrorResult',
          query: { msg: err.message },
        })
      })
  }

  /**
   * 发起支付
   */
  function pay() {
    loading.value = true
    aliH5Pay(code.value)
      .then(({ data }) => {
        loading.value = false
        // 跳转到H5支付页面
        window.location.href = data.payBody
      })
      .catch((err) => {
        // 跳转到错误页
        router.push({
          name: 'PayErrorResult',
          query: { msg: err.message },
        })
      })
  }
</script>

<style lang="less" scoped>
  .page-container {
    width: 100%;
    border-radius: 4px;
    padding: 50px 0;
    height: 100vh;

    .text-center {
      h1 {
        color: #666;
        padding: 2vh 0;
        font-size: x-large;
      }
    }
  }
</style>
