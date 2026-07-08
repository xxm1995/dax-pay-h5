# DaxPay 移动 H5 端

DaxPay 开源版支付系统的移动端网关应用，基于 vue3-vant4-mobile 模板搭建。

## 技术栈

| 技术       | 版本 | 说明                                           |
| ---------- | ---- | ---------------------------------------------- |
| Vue        | 3.5  | 前端框架                                       |
| Vite       | 8.x  | 构建工具                                       |
| TypeScript | 5.9  | 开发语言                                       |
| Vue Router | 5.x  | 路由（hash 模式）                              |
| Pinia      | 3.x  | 状态管理（pinia-plugin-persistedstate 持久化） |
| Vant       | 4.x  | 移动端 UI 组件库                               |
| UnoCSS     | 66.x | 原子化 CSS                                     |
| @vueuse    | 14.x | 组合式工具集                                   |
| Axios      | 1.x  | HTTP 请求                                      |
| vconsole   | 3.x  | 移动端调试面板（仅 dev 动态加载）              |

## 环境依赖

| 环境 | 版本                  | 备注                                 |
| ---- | --------------------- | ------------------------------------ |
| Node | ^22.13.0 \|\| ^24.0.0 | 仅支持 LTS（22/24），低版本无法构建  |
| pnpm | >=10.0.0              | 包管理器，强制 pnpm（禁用 npm/yarn） |

> 项目通过 `packageManager` 字段锁定 pnpm@10.32.1，启用 corepack 后会自动切换到对应版本。

## 启动命令

```shell
# 安装项目依赖
pnpm install

# 启动开发服务器（端口 9500）
pnpm run dev

# 构建打包
pnpm build

# 类型检查
pnpm run type:check

# 代码检查 / 自动修复
pnpm run lint
pnpm run lint:fix
```

## 环境配置

| 文件               | 说明                                                                 |
| ------------------ | -------------------------------------------------------------------- |
| `.env`             | 应用基础信息（标题、端口）                                           |
| `.env.development` | 开发环境（代理 `/server` → `http://127.0.0.1:19999`、vconsole 开启） |
| `.env.production`  | 生产环境（接口前缀、压缩配置）                                       |

## License

本项目基于 [GNU LGPL v3.0](./LICENSE) 协议开源，同时受[《用户授权使用协议》](./USER-AGREEMENT.txt)约束。在使用前请阅读上述协议，如果不同意请勿进行使用。
