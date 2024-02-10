<template>
  <van-form ref="formRef" v-if="getShow" class="flex flex-col items-center" @submit="handleSubmit">
    <van-field
      class="enter-y items-center mb-25px !rounded-md"
      v-model="formData.username"
      name="username"
      placeholder="用户名"
      :rules="getFormRules.username"
    >
      <template #left-icon>
        <Icon>
          <UserOutlined />
        </Icon>
      </template>
    </van-field>
    <van-field
      class="enter-y items-center mb-25px !rounded-md"
      v-model="formData.password"
      :type="switchPassType ? 'password' : 'text'"
      name="password"
      placeholder="密码"
      :rules="getFormRules.password"
      @click-right-icon="switchPassType = !switchPassType"
    >
      <template #left-icon>
        <Icon>
          <LockOutlined />
        </Icon>
      </template>
      <template #right-icon>
        <Icon v-if="switchPassType">
          <EyeInvisibleOutlined />
        </Icon>
        <Icon v-else>
          <EyeOutlined />
        </Icon>
      </template>
    </van-field>

    <div class="enter-y w-full px-5px flex justify-between mb-100px"> </div>

    <van-button
      class="enter-y !rounded-md !mb-25px"
      type="primary"
      block
      native-type="submit"
      :loading="loading"
    >
      登 录
    </van-button>
  </van-form>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, unref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { showFailToast, showLoadingToast, showSuccessToast } from 'vant'
  import type { FormInstance } from 'vant'
  import { Icon } from '@vicons/utils'
  import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined } from '@vicons/antd'
  import { useUserStore } from '@/store/modules/user'
  import { ResultEnum } from '@/enums/httpEnum'
  import { PageEnum } from '@/enums/pageEnum'
  import { LoginStateEnum, useLoginState, useFormRules } from './useLogin'

  const { getLoginState } = useLoginState()
  const { getFormRules } = useFormRules()
  const userStore = useUserStore()
  const router = useRouter()
  const route = useRoute()

  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const switchPassType = ref(true)
  const formData = reactive({
    username: '',
    password: '',
  })

  const getShow = computed(() => unref(getLoginState) === LoginStateEnum.LOGIN)

  function handleSubmit() {
    formRef.value
      ?.validate()
      .then(async () => {
        try {
          loading.value = true
          showLoadingToast('登录中...')
          const { code, msg } = await userStore.Login({
            account: formData.username,
            password: formData.password,
            client: 'dax-pay',
            loginType: 'password',
          })
          if (code == ResultEnum.SUCCESS) {
            const toPath = decodeURIComponent((route.query?.redirect || '/') as string)
            showSuccessToast('登录成功，即将进入系统')
            if (route.name === PageEnum.BASE_LOGIN_NAME) {
              router.replace('/')
            } else router.replace(toPath)
          } else {
            showFailToast(msg || '登录失败')
          }
        } finally {
          loading.value = false
        }
      })
      .catch(() => {
        console.error('验证失败')
      })
  }

  onMounted(() => {})
</script>

<style scoped lang="less"></style>
