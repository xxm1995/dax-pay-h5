<p align="center">
	<img src="_doc/images/dax-pay.svg" width="45%">
</p>

# DaxPay H5端

## 🍈项目介绍

> axPay是一套开源支付网关系统，已经对接支付宝、微信支付、云闪付相关的接口。可以独立部署，提供接口供业务系统进行调用，不对原有系统产生影响

## 🍒 项目地址

| 项目        | GITEE                                       | GITHUB                                          |
| ----------- | ------------------------------------------- | ----------------------------------------------- |
| 后端地址    | [GITEE](https://gitee.com/dromara/dax-pay)  | [GITHUB](https://github.com/dromara/dax-pay)    |
| Web前端地址 | [GITEE](https://gitee.com/bootx/dax-pay-ui) | [GITHUB](https://github.com/xxm1995/dax-pay-ui) |
| H5前端地址  | [GITEE](https://gitee.com/bootx/dax-pay-h5) | [GITHUB](https://github.com/xxm1995/dax-pay-h5) |

## 🏬 系统演示

### 管理平台:

> 注：演示账号部分功能修改删除权限未开放。

地址：https://daxpay.demo.bootx.cn

账号：daxpay

密码：123456

### 网关接口

> 注：接口平台只开放支付网关相关的接口，不开放系统其他接口。

地址: https://daxpay.server.bootx.cn/doc.html

账号: daxpay

密码: 123456

### 收银台演示

> 请勿大额支付，可以通过后台管理端进行退款

电脑收银台地址: https://daxpay.demo.bootx.cn/#/cashier

手机收银台地址: https://daxpay.demo.bootx.cn/h5/#/cashier/uniCashier

## 项目启动

- 必须使用 [pnpm>=8.6.10](https://www.pnpm.cn/)，否则依赖可能安装不上，推荐使用`8.6.10`。
- [Node.js](http://nodejs.org/) 版本要求`18.x`以上，推荐使用 `^20.9.0`。

```shell
# 安装项目依赖
pnpm install
# 启动项目
pnpm run dev
# 构建打包
pnpm build
```

## 🍷License

Apache License Version 2.0
