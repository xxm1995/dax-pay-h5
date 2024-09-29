import type { Ref } from 'vue'

/**
 * 键盘hooks
 * @param amount
 */
export function useKeyboard(amount: Ref<string>) {
  /**
   * 输入
   */
  function input(value: string) {
    const amountStr = amount.value
    if (amountStr === '0') {
      if (value === '.') {
        amount.value = '0.'
        return
      }
      amount.value = String(value)
    }
    else {
      // 只允许有一个小数点
      if (value === '.' && amountStr.includes('.')) {
        return
      }
      // 小数最多两位
      if (amountStr.includes('.') && amountStr.length - amountStr.indexOf('.') > 2) {
        return
      }
      // 金额最高100万
      if (amountStr.split('.')[0].length > 6) {
        // 是否有小数,
        if (amountStr.includes('.') && amountStr.split('.')[1].length > 1) {
          return
        }
        if (!amountStr.includes('.') && value !== '.') {
          return
        }
      }

      amount.value = amountStr.concat(value)
    }
  }

  /**
   * 删除
   */
  function del() {
    if (amount.value.length > 1) {
      amount.value = amount.value.substring(0, amount.value.length - 1)
    }
    else {
      amount.value = '0'
    }
  }

  return {
    input,
    del,
  }
}
