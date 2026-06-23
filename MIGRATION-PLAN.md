# DaxPay H5 升级迁移方案

> 基于 [vue3-vant4-mobile](https://github.com/xiangshu233/vue3-vant4-mobile) 重建 H5 端脚手架。
> 旧版业务代码（收银台/订单/业务组件/crypto 签名）**不迁移**，后续将重新实现。
> 本方案仅产出干净的、带完整基础设施的 DaxPay H5 空壳项目。

## 一、目标与原则

**目标**：以 `vue3-vant4-mobile@main` 为新脚手架重建 `dax-pay-h5`，拿到 Vite 8 / Pinia 3 / Vue Router 5 / UnoCSS 66 的架构红利 + Dark Mode + 系统主题色 + keep-alive/routeStore + http 分层封装，产出等待业务开发的干净基座。

**原则**：

1. 模板作基座，裁掉所有 demo 演示业务（dashboard / example / message / my 演示页、ECharts、Mock）。
2. 现有 DaxPay 业务资产（收银台、订单、22 个业务组件、crypto、api、views、router modules、store.user 等）**全部不迁移**，后续重新实现。
3. 保留模板的完整基础设施（Dark Mode、主题色、keep-alive、http 分层），但 http 分层保留**通用版**，不植入业务拦截器逻辑（token 头等留待业务阶段定）。
4. 分阶段可验证，每个阶段结束都能 `pnpm dev` 起来且 `pnpm type:check` 通过。
5. 保留 DaxPay 品牌与环境：应用名 `DaxPay`、端口 `9100`、代理 `/server` → `http://127.0.0.1:19999/`、`VITE_GLOB_*` 环境变量体系。

## 二、最终技术栈锁定

| 类别                                  | 版本                             | 来源                                  |
| ------------------------------------- | -------------------------------- | ------------------------------------- |
| Vite                                  | ^8.0.2                           | 模板                                  |
| Vue                                   | ^3.5.30                          | 模板                                  |
| Vue Router                            | ^5.0.4                           | 模板                                  |
| Pinia                                 | ^3.0.4                           | 模板                                  |
| pinia-plugin-persistedstate           | ^4.7.1                           | 模板（替代旧 `pinia-plugin-persist`） |
| Vant                                  | ^4.9.22                          | 模板                                  |
| UnoCSS                                | ^66.6.7（含 `@unocss/*` 同版本） | 模板                                  |
| TypeScript                            | ^5.9.3                           | 模板                                  |
| vue-tsc                               | ^3.2.6                           | 模板                                  |
| @vitejs/plugin-vue                    | ^6.0.5                           | 模板                                  |
| @vueuse/core                          | ^14.2.1                          | 模板                                  |
| unplugin-auto-import / vue-components | ^21 / ^32                        | 模板                                  |
| tsx                                   | ^4.21                            | 模板（替代 `esno`）                   |
| terser                                | ^5.46                            | 模板（drop console）                  |
| vconsole + vite-plugin-vconsole       | 保留现有版本                     | 开发期调试工具                        |
| **Node**                              | **>=22.12.0**                    | 用户要求（engines 锁定 22）           |
| pnpm                                  | >=9.0.2                          | monorepo 约定                         |

**不安装**：`echarts`、`mockjs`、`vue-qr`（业务重写后按需再加）。

## 三、纳入 / 裁剪 / 迁入清单

### 从模板纳入

- 构建脚本：`build/` 全套（`script/buildConf.ts`、`postBuild.ts`、`getConfigFileName.ts`、`vite/plugin/*`）
- `vite.config.ts`（`rolldownOptions` + oxc/terser minify）
- `main.ts`（按需 vant 样式 + `setupStore`/`setupRouter` 异步 mount）
- `store/index.ts`（`setupStore` + `persistedstate`）
- `router/`（`base` + `index` + `modules` + `router-guards` + `routeStore`）
- `utils/http/axios/`（分层封装，全套 7 文件，保留通用版）
- `hooks/`（`core`/`event`/`setting`/`web` 分层，移除 `useECharts`）
- `layout/`（`index.vue` + `FloatingNavBar`）
- Dark Mode + 主题色体系：`store/modules/designSetting.ts` + `settings/designSetting.ts` + `hooks/setting/useDesignSetting.ts` + `views/my/ThemeSetting.vue` + `styles/entry.css` + `styles/vant.less` + `App.vue`
- `enums/`（breakpointEnum / cacheEnum / httpEnum / pageEnum）
- `utils/`（Storage、dateUtil、domUtils、env、is、urlUtils、log、index）
- `types/`（auto-imports.d.ts、config.d.ts、global.d.ts、index.d.ts、modules.d.ts）
- `uno.config.ts`（webfonts provider 改回 `none`）
- `eslint.config.js`、`commitlint.config.cjs`、`.editorconfig`、`simple-git-hooks`

### 从模板裁剪

- `src/views/dashboard/`、`example/`、`message/`（含 barChart/lineChart/pieChart）、`my/` 演示页（**保留 `ThemeSetting.vue`** 作为主题设置页骨架）
- `src/hooks/web/useECharts.ts` + `src/utils/lib/echarts.ts`
- `mock/` 目录 + `build/vite/plugin/mock.ts` + `vite-plugin-mock` + `mockjs` + `@types/mockjs` 依赖 + `VITE_GLOB_PROD_MOCK`
- `vercel.json`、`public/_redirects`、`.github/workflows/`
- `uno.config.ts` 的演示 safelist、`webfonts` provider（改 `none`）

### 从现有项目迁入（仅非业务资产）

- `.env` / `.env.development` / `.env.production`（端口 9100、代理 `/server`、`VITE_V_CONSOLE`、`VITE_DROP_CONSOLE`、`VITE_BUILD_COMPRESS`）
- `用户授权使用协议.txt`
- `README.md`（业务说明保留，技术说明换新栈）
- `.git/`（保留提交历史）
- `index.html` 的 DaxPay 品牌（title / meta）

### 明确丢弃（不迁移，重新实现）

`src/api/*`、`views/*`、`components/*`（22 个业务组件）、`utils/{axios,crypto,format,validate}.ts`、`router/{guard,modules}/*`、`store/modules/user.ts`、`hooks/{useConfig,useUser,useTheme,useDevice,useRequest,useCountdown}.ts`、`layout/{Default,IndexTabBar,Helper}*`、`vue-qr` 依赖——全部不迁。

> 旧版完整业务代码已保留在备份分支 `h5-legacy`（tag `h5-legacy-v3.0.0`），供重新实现时参考。

## 四、交付物定义

产出一个**干净的 DaxPay H5 脚手架**：

- 基于 vue3-vant4-mobile，裁掉所有 demo 演示页。
- 保留完整基础设施：Dark Mode + 主题色 + keep-alive/routeStore + http 分层 + vconsole。
- 品牌定制：应用名 DaxPay、端口 9100、代理 `/server` → `127.0.0.1:19999`。
- 只保留一个占位首页（登录后落地，最简），等待业务开发。
- `pnpm dev` / `pnpm type:check` / `pnpm lint` / `pnpm build` 全绿。

## 五、分阶段执行计划

### 阶段 0：准备（0.3 天）

- [x] `dax-pay-h5` 打 tag `h5-legacy-v3.0.0`（旧业务最后状态）
- [x] 切备份分支 `h5-legacy`（保留全部旧业务供后续参考）
- [x] Node 版本确认 ≥ 22.12.0（实测 v24.17.0）
- [x] 记录现网基础配置：端口 9100、代理 `/server` → `http://127.0.0.1:19999/`

### 阶段 1：脚手架搭建（0.5 天）

- [ ] 克隆 `vue3-vant4-mobile`，整体替换 `dax-pay-h5`（保留 `.git/`、协议文件、`README.md`、本文件）
- [ ] `package.json`：`name=daxpay-gateway-ui`、`version=3.1.0`、`engines.node=">=22.12.0"`、`engines.pnpm=">=9.0.2"`
- [ ] 删除演示业务：`src/views/{dashboard,example,message,my}`（`my/ThemeSetting.vue` 单独保留）、`src/hooks/web/useECharts.ts`、`src/utils/lib/`、`mock/`、`build/vite/plugin/mock.ts`、`vercel.json`、`.github/`、`public/_redirects`
- [ ] 删除依赖：`echarts`、`mockjs`、`@types/mockjs`、`vite-plugin-mock`、`@oxc-parser/binding-win32-x64-msvc`
- [ ] 加回依赖：`vconsole`、`vite-plugin-vconsole`，新建 `build/vite/plugin/vconsole.ts` 注册
- [ ] `src/views/` 只留一个占位首页 `views/home/index.vue`
- [ ] `uno.config.ts`：webfonts provider 改 `none`、清空演示 safelist
- [ ] `pnpm install && pnpm dev` 验证脚手架自洽
- **验证**：`dev` / `type:check` / `build` 三绿

### 阶段 2：基础设施定制（0.5 天）

- [ ] 环境变量：用现有 `.env*` 覆盖（端口 9100、代理、`VITE_V_CONSOLE=true`、`VITE_DROP_CONSOLE`、`VITE_BUILD_COMPRESS`），删 `VITE_GLOB_PROD_MOCK`
- [ ] `build/utils.ts` 的 `wrapperEnv` 同步调整校验项
- [ ] `router/modules.ts`：清空 demo 路由，只留登录页 + 占位首页 + 404
- [ ] `store/modules/user.ts`：保留模板默认骨架（供后续业务用）
- [ ] `main.ts`：加回 vconsole 开发环境初始化
- [ ] HTTP 分层：保留模板通用版，不植业务拦截器
- **验证**：dev 起来，登录页/占位首页可访问，Dark Mode + 主题色切换生效

### 阶段 3：样式与适配（0.3 天）

- [ ] `postcss.config.js`：采用模板版（去掉现有 `exclude:[/src/]` 这个疑似 bug 的配置）
- [ ] 合并 `styles/var.less`，确认 vant 主题变量
- [ ] Dark Mode 下占位页自查

### 阶段 4：质量验证（0.2 天）

- [ ] `pnpm type:check`（vue-tsc 3）零错误
- [ ] `pnpm lint`（@antfu/eslint-config 2）零 error
- [ ] `pnpm build` 成功，记录产物体积基线
- [ ] `npx simple-git-hooks` 装 hooks
- [ ] 真机扫描进 H5，验证 viewport 适配 + Dark Mode

**工期估算**：约 1.8 人天

## 六、关键 Breaking Change 应对手册

| 变更点                              | 现状                               | 新版应对                                                                                  |
| ----------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------- |
| Vite 8 移除 CJS Node API            | 配置已 ESM                         | 确认所有 `.js` 配置含 ESM 导出；`postcss.config.js` 保持 `import`                         |
| `rollupOptions` → `rolldownOptions` | rollupOptions                      | `vite.config.ts` 改名（模板已示范）                                                       |
| esbuild drop 失效                   | `esbuild.drop`                     | 改 `minify:'terser'` + `terserOptions.compress.drop_console`（模板已示范）                |
| Pinia 3 持久化                      | `pinia-plugin-persist`             | 换 `pinia-plugin-persistedstate`，`persist:true` 写法基本兼容                             |
| Vue Router 4 → 5                    | v4                                 | `createRouter`/`createWebHashHistory` 兼容；守卫 API 复核                                 |
| UnoCSS 0.58 → 66                    | 分散包 0.58                        | 统一升 66，preset/transformer 导入路径不变，配置语法兼容                                  |
| @vueuse 10 → 14                     | v10                                | 业务重写后按需核对（本项目不迁旧 hooks，影响小）                                          |
| vue-tsc 1 → 3                       | v1                                 | CLI 兼容；TS 需 ≥5.5                                                                      |
| vant 全量 → 按需                    | `app.use(Vant)`                    | `main.ts` 删 `app.use(Vant)`，靠 unplugin-vue-components 自动注册 + 手动导 4 个副作用样式 |
| esno → tsx                          | `esno ./build/script/postBuild.ts` | script 改 `tsx ./build/script/postBuild.ts`                                               |

## 七、风险与回滚

| 风险                                        | 等级 | 缓解                                 |
| ------------------------------------------- | ---- | ------------------------------------ |
| UnoCSS 66 与业务原子类不兼容                | 中   | 阶段 1 先跑通，出问题可临时锁回 0.58 |
| Pinia 3 persistedstate 持久化行为差异       | 中   | 阶段 2 测主题/设置持久化             |
| vant 按需导入漏样式（Toast/Dialog 等）      | 中   | `main.ts` 显式导 4 个，其余用到再补  |
| Vite 8 三方插件未跟进（vconsole/svg-icons） | 中   | 阶段 1 验证，必要时锁版本            |

**回滚**：`h5-legacy` 分支随时可切回；每个阶段结束提交一次，便于二分定位。

## 八、约定备忘

- `node` 锁定 `>=22.12.0`，`pnpm` `>=9.0.2`。
- 路由模式：`createWebHashHistory`（H5 嵌入支付场景更稳）。
- 接口 token 头约定：`Accesstoken`（Sa-Token，来自 DaxPay 后端约定），待业务阶段在 http transform 中实现。
- 不自动提交代码，每阶段结束询问是否提交。
