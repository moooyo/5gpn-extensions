# 5gpn 扩展

[English](README.md) | 简体中文

本仓库是独立维护的原生 5gpn 扩展的第一方目录。5gpn 核心仓库负责运行时和严格的
`5gpn.io/v1` 契约；它不会将扩展源代码纳入仓库或镜像化。

每个扩展导入后默认处于禁用状态。启用前，请审查其不可变清单、脚本、捕获主机、精确路由规则、网络源、执行位置及运营者出口要求。

| 扩展 | 用途 | 许可证 |
| --- | --- | --- |
| `ad-platform-blocker` | 获取有界选择器流量并阻止 201 条经审查的广告平台路由 | CC BY-NC-SA 4.0 |
| `apple-wloc` | 将 Apple WLOC 响应改写为运营者选择的位置 | MIT |
| `bilibili-cleaner` | 移除部分哔哩哔哩广告和推广内容 | GPL-3.0-only |
| `httpdns-interceptor` | 获取 58 个 HTTPDNS 域名；拒绝 59 条网关可见 CIDR 路由和 7 条请求路径 | CC BY-NC-SA 4.0 |
| `testflight-region-unlock` | 使用运营者选择的出口改写 TestFlight 店面 | CC BY-NC-SA 4.0 |
| `weatherkit` | 控制 WeatherKit 数据集、保留可用性并在本地规范化空气质量数据 | Apache-2.0 |
| `youtube-cleaner` | 清理 YouTube 响应并准备经审查的外部 Onesie 播放链路 | Apache-2.0 |
| `zhihu-cleaner` | 移除部分知乎传输配置、广告、推广内容和导航入口 | CC BY-NC-SA 4.0 |

## 安装

通过 5gpn Console 的 **Install from URL** 操作，使用所需目录中原始
`extension.yaml` 的 URL。本公共目录可经网关访问，无需凭据。对于私有分支，请使用 Console 的本地添加/上传流程，或通过运营者控制的公共 HTTPS 源发布经审查的文件；绝不要在扩展 URL 中嵌入仓库凭据。

| 扩展 | 清单 URL |
| --- | --- |
| `ad-platform-blocker` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/ad-platform-blocker/extension.yaml> |
| `apple-wloc` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/apple-wloc/extension.yaml> |
| `bilibili-cleaner` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/bilibili-cleaner/extension.yaml> |
| `httpdns-interceptor` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/httpdns-interceptor/extension.yaml> |
| `testflight-region-unlock` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/testflight-region-unlock/extension.yaml> |
| `weatherkit` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/weatherkit/extension.yaml> |
| `youtube-cleaner` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/youtube-cleaner/extension.yaml> |
| `zhihu-cleaner` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/zhihu-cleaner/extension.yaml> |

每次导入均从禁用状态开始。启用前，请审查不可变快照摘要、捕获主机、操作、设置、精确路由规则、网络源、执行位置以及任何所需的运营者出口绑定。安装扩展不会启用全局拦截总开关，也不会在设备上信任其拦截 CA。

## Marketplace

第一方 marketplace 以严格 JSON 发布于：

```text
https://moooyo.github.io/5gpn-extensions/marketplace/v1/index.json
```

5gpn 不会预置此市场或任何其他市场。请先审查本仓库；只有在你选择信任它时，才将上方 URL 复制到 **插件市场 → 添加市场**。运营者也可以选择添加其他兼容来源。

显式添加后，Console 即可浏览已审查的扩展。浏览不会安装或启用扩展。选择条目后会进入标准的原生 manifest 解析与快照流程；生成的不可变快照仍保持禁用，直到运营者审查其捕获主机、权限、设置、路由规则、执行位置和出口绑定。

Marketplace 是发现元数据，不是可执行信任边界。每个条目指向常规的 `main` manifest 与本地脚本 URL，使现有显式更新检查仍能重新抓取已安装源。同时，列表记录其 40 位构建提交对应内容的精确 SHA-256 和字节数。网关必须核对下载到的 manifest 与脚本字节及其声明摘要，然后执行完整、严格的 `5gpn.io/v1` 解析；不能将列表中的描述或能力摘要当作运行时权威。脚本仍由常规不可变快照流程抓取、校验和保存。摘要不匹配时必须拒绝。

GitHub Pages 在上述稳定 URL 提供当前列表。公开 JSON Schema 位于
<https://moooyo.github.io/5gpn-extensions/marketplace/v1/schema.json>。
当仓库存在具备 Pages 写权限的 `PAGES_ENABLEMENT_TOKEN` secret 时，固定版本的 Pages action 会尝试首次启用站点。如果组织策略禁止该 token 或自动启用，唯一的手工前置是在 **Settings → Pages** 中进行一次设置，将 Source 选择为 **GitHub Actions**；无需手工维护发布分支或生成站点。

## 开发扩展

规范性运行时契约见核心项目的
[`5gpn.io/v1` author guide](https://github.com/moooyo/5gpn/blob/beta/docs/native-extensions.md)。本节是本目录中扩展维护者可独立使用的检查清单。5gpn 仅接受此处说明的原生格式；请勿发布 Loon、Surge、Quantumult X、Stash 或其他兼容性全局对象或清单。

### 目录结构

每个顶层目录只保留一个可独立安装的扩展：

```text
example-cleaner/
  extension.yaml
  clean-response.js
  README.md
```

`extension.yaml` 和运行时需要的每个脚本都必须是目录中的不可变本地文件。README 必须记录适用许可证、创作者署名、固定到提交的每个上游源、原始 URL、SHA-256 摘要、获取日期、移植决策、排除项、限制、更新流程和验证步骤。

### 可用能力

| 能力 | 清单声明 | 运行时效果与边界 |
| --- | --- | --- |
| 获取流量 | `traffic.captureHosts` | 精确 DNS 名称或受限的 `*.example.com` 通配符。这是唯一的流量获取权限，启用时会为端口 80 和 443 发布 DNS、证书和 mihomo 规则。 |
| 应用已审查的全局路由 | `traffic.routingRules` | 有界类型化选择器只能对已经到达网关的命中流量执行 `REJECT` 或 `DIRECT`。精确规则与插件共用一次启用确认，不能命名代理组，且仅在插件和 MITM 总开关均启用时存在。 |
| 转换请求或响应 | `actions[]` | 有序的结构化匹配器在声明的阶段选中一个动作。每个动作主机都必须属于同一扩展的 `captureHosts`。 |
| 拦截匹配的路径 | `script.reject` | 在请求发往上游之前中止。无代码。 |
| 返回固定响应 | `script.mock` | 声明状态码、响应头,以及 `body` 或 `base64Body`。无代码,且请求不会离开网关。 |
| 改写 JSON 响应体 | `script.jq` | 直接携带上游模块自己的 `response-body-json-jq` 表达式,由 gojq 执行,完全不进 JavaScript 运行时。可通过 `$settings` 读取操作员选择。 |
| 运行已发布的代理客户端 bundle | `script.entry: proxy-compat` | 以 Loon 人格加载钉住的上游脚本。 |
| 读取正文 | `script.bodyMode` | `none`、UTF-8 `text`，或以 `Uint8Array` 表示的 `binary`，并受 `maxBodyBytes` 限制。 |
| 类型化运营者配置 | `settings[]` | `text`、`select`、`boolean`、`number` 和 `location`；启用前必须完整填写必填值。 |
| 持久状态 | `permissions.persistentStorage: true` | 添加受扩展作用域和配额限制的 `context.storage`；脚本绝不能选择路径或访问文件系统。 |
| 按源（origin）限定的出站 HTTP | `permissions.network.origins` | 仅为精确的 HTTP(S) 源（origin）添加同步 `context.network.request`。不存在环境级 `fetch`、重定向跟随、Cookie jar 或套接字访问。运营者必须确认可见的已解密数据可能被发送到这些源。 |
| 覆盖一个名字的解析结果 | `traffic.upstreamMappings` | Loon 的 `[Host]`。目标可以是地址（`1.2.3.4`）、别名（`origin.example.net`）或解析器（`server:1.1.1.1`）。名字的 Host 头和 TLS SNI 保持不变，只有地址改变，而且改变发生在网关的解析器里 —— 因此客户端的应答与被捕获主机的上游腿遵循同一张表。映射只提供地址，绝不提供转发决策：映射到国内地址的国内域名依然直连，映射到境外地址的依然被引流。地址型目标经过 SSRF 检查。映射无法作用于由远端解析的出站，因为代理节点收到的是名字而不是地址。 |
| 要求区域/运营者出口 | `requirements.egressGroup.required: true` | 启用前强制运营者绑定现有 mihomo 组或 `DIRECT`。扩展不能命名、检查、选择或更改任意组；另行审查的路由规则只能选择 `DIRECT`。 |
| 组合多个扩展 | Console 执行顺序 | 请求和响应操作自上而下运行。对于重叠目的地，同一顺序中的第一个已绑定扩展和第一条全局路由规则生效。重排需要审查调整前后顺序并确认。 |

脚本永远不会获得文件系统、进程、计时器、模块加载器、原始套接字、环境级 DNS、环境级 Go 对象或不受限制的网络访问。所有上游 TCP 和 UDP 均通过已认证的 mihomo `intercept-egress` 返回；扩展不能选择直接 sidecar 出口。

### 最小清单

该文档为严格 YAML：未知字段、重复键、别名、锚点、合并键和多文档均会被拒绝。

```yaml
apiVersion: 5gpn.io/v1
kind: Extension

metadata:
  id: io.example.response-cleaner
  name: Example Response Cleaner
  version: 1.0.0
  description: Removes one reviewed response field.

permissions:
  persistentStorage: false

traffic:
  captureHosts:
    - api.example.com

settings:
  - key: removePromotion
    type: boolean
    label: Remove promotion
    description: Removes the reviewed promotion field when enabled.
    required: true
    default: true

actions:
  - id: clean-items-response
    phase: response
    match:
      hosts:
        - api.example.com
      schemes:
        - https
      methods:
        - GET
      pathRegex: '^/v1/items(?:\?.*)?$'
      statusCodes:
        - 200
    script:
      source: ./clean-response.js
      bodyMode: text
      timeoutMs: 1000
      maxBodyBytes: 1048576
```

元数据 ID 是长度为 3 到 40 字节的稳定小写点分标识符，版本使用语义化版本语法。通配符捕获主机仅匹配子名称；`*.example.com` 不包含顶点域 `example.com`。

每个操作声明请求或响应阶段、非空主机子集、一个或两个协议方案（scheme）、针对路径加查询进行匹配的锚定 RE2 `pathRegex`、可选的大写方法以及可选的响应状态码。脚本恰好声明 `source` 或 `inline` 之一，超时范围为 50 至 30000 毫秒，正文上限范围为 1024 至 67108864 字节。

通过 URL 安装的清单可以使用相对 HTTPS 脚本源。本地粘贴或上传的清单必须使用内联脚本或绝对 HTTPS 脚本 URL。

### 脚本契约

每个脚本恰好定义一个全局入口点：

```javascript
function transform(context) {
  const document = JSON.parse(context.response.body)
  if (context.settings.removePromotion) delete document.promotion
  return { response: { body: JSON.stringify(document) } }
}
```

受限 context 可暴露：

```text
context.phase
context.request.url
context.request.method
context.request.headers
context.request.body
context.response.status
context.response.headers
context.response.trailers
context.response.body
context.settings
context.storage
context.network.request
```

请求操作可以返回请求补丁、合成响应、`{abort:
true}`、`null` 或 `undefined`。响应操作只能返回响应补丁、中止或不作更改。改写后的 URL 必须保持在所属扩展的捕获主机边界内。未知结果字段和未捕获的脚本错误会使匹配流以拒绝方式失败（fail closed）。

响应操作和合成响应可以包含有界 `trailers` 补丁；请求补丁不能创建 trailer。运行时会校验名称、值、字段数、单值大小和总字节数，并拒绝 framing 等禁止字段。有效的 HTTP/gRPC trailer 会在 HTTP/1.1、HTTP/2 和 HTTP/3 间保留。

仅在声明了持久存储时，`context.storage` 才存在。仅在声明并确认精确源时，`context.network.request` 才存在。网络响应包含 `url`、`status`、`headers`、`trailers`、二进制 `body`，以及当正文是有效 UTF-8 时的 `text`。重定向和非 2xx 响应会返回给脚本，而不会被静默跟随。

### 声明可选权限

仅声明运行时实现实际使用的能力：

```yaml
permissions:
  persistentStorage: true
  network:
    origins:
      - https://api.example.net

requirements:
  egressGroup:
    required: true

traffic:
  captureHosts:
    - api.example.com
  upstreamMappings:
    - host: api.example.com
      target: origin.example.net
```

网络源仅包含规范 scheme、主机名和有效端口；通配符、路径、查询、片段、userinfo、IP 字面量、localhost 和私有名称均会被拒绝。上游映射仅适用于已由同一扩展拥有的主机，且不得以私有、回环、链路本地或其他不安全地址为目标。

### 开发和审查流程

1. 选择权威上游仓库和不可变提交。不得将扩展商店或镜像的根许可证视为比更具体的原始文件许可证更有权威性。
2. 移植行为前，记录并验证每个源文件和许可证文件的原始 URL、大小、SHA-256、获取日期、创作者署名和许可证。
3. 仅将经审查的行为转换为严格的原生清单。优先使用声明式动作(`reject`/`mock`/`jq`)——本仓库的八个扩展全部由它们和 `proxy-compat` 构成,不含任何 JavaScript。缩小捕获主机和匹配器，而不是保留宽泛的客户端专用模式。
4. 仅在使用时声明存储、网络源、上游映射和所需出口。记录获准的网络调用可能泄露哪些已解密数据。
5. 添加正向、无操作、格式错误输入和边界测试样例。保留无关字段，并在部分转换不安全时以拒绝方式失败（fail closed）。
6. 运行目录验证器和当前核心解析器门禁：

   ```powershell
   npm ci
   if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE" }
   npm test
   if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
   npm run routing:check
   if ($LASTEXITCODE -ne 0) { throw "routing check failed with exit code $LASTEXITCODE" }
   npm run verify:upstreams
   if ($LASTEXITCODE -ne 0) { throw "upstream verification failed with exit code $LASTEXITCODE" }
   ```

   随后运行 [`MIGRATION.md`](MIGRATION.md) 中的当前核心解析器集成命令。

7. 在禁用状态下安装候选项，检查其快照摘要和权限摘要，配置必需设置和出口，然后仅在已授权的测试设备上启用它，且该设备已信任共享拦截根证书。

更新必须保持 `metadata.id`，当不可变运行时字节变更时提升 `metadata.version`，刷新溯源信息和测试样例，并在替换后保持禁用。请勿引入自动更新、可变的运行时脚本获取或兼容性垫片。

上游版本的选择刻意保持为人工流程。每次源码迁移、已安装版本发布和回滚都必须遵循可复用的 [`MIGRATION.md`](MIGRATION.md) 手册。该手册要求记录基线与候选版本、比较能力和许可证、明确状态策略、以禁用状态应用更新、完成聚焦测试与核心解析验证，并准备由安装源发布者管理、可演练的前滚式回退；同时说明不控制该 URL 的运营者仅有的有限应急选项。该手册不会发现或自动选择上游版本。

## 许可证

这是一个多许可证仓库。MIT、GPL-3.0-only、Apache-2.0 和 CC-BY-NC-SA-4.0 适用于明确的文件和目录边界。由于 NonCommercial 限制，CC-BY-NC-SA 材料可获取源代码，但不符合 OSI 定义的 Open Source。请参阅根目录的
[`LICENSE`](LICENSE)、[`LICENSES/`](LICENSES/) 下的完整文本、
[`REUSE.toml`](REUSE.toml) 中的机器可读映射、
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) 以及各扩展 README。

## 验证

```powershell
npm ci
if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE" }
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
npm run routing:check
if ($LASTEXITCODE -ne 0) { throw "routing check failed with exit code $LASTEXITCODE" }
npm run verify:upstreams
if ($LASTEXITCODE -ne 0) { throw "upstream verification failed with exit code $LASTEXITCODE" }
npm run marketplace:build -- --revision 0000000000000000000000000000000000000000 --profile v1 --output marketplace.json
if ($LASTEXITCODE -ne 0) { throw "marketplace build failed with exit code $LASTEXITCODE" }
npm run marketplace:build -- --revision 0000000000000000000000000000000000000000 --profile v1 --check marketplace.json
if ($LASTEXITCODE -ne 0) { throw "marketplace check failed with exit code $LASTEXITCODE" }
```

验证门禁检查清单结构、本地脚本引用、捕获主机所有权、JavaScript 语法、禁止的兼容性全局对象、上游溯源文档及每个扩展的行为测试样例。独立的上游命令会下载 README 中记录的每个不可变源 URL，并验证其实际 SHA-256 是否出现在同一文档中；它有意要求网络访问。

Marketplace 生成器只读取 `marketplace/metadata.json` 中经审查的市场元数据；名称、版本、描述、资源、摘要、大小和能力摘要均从严格扩展 manifest 与本地文件派生。对于同一个 revision，输出是确定的。生成器会创建不存在的 `--output` 父目录，`--check` 则要求逐字节完全一致。fixture 测试会编译公开的 Draft 2020-12 schema，并使用它校验真实生成的目录。Pages 工作流会重新运行所有校验和上游检查，从已检出的 `GITHUB_SHA` 生成列表、复核生成字节，并且只部署静态 marketplace 与 schema。

索引由同一次构建产出两个 profile。`v1` 冻结在稳定版核心能接受的形态：它用 `DisallowUnknownFields` 解析索引，因此往里加字段并非向后兼容的增量——不认识该字段的核心会拒绝整个文档，连带丢掉整个扩展目录。`v1beta` 则携带类型化 policy 投影，供已经学会读它的核心使用。`--profile` 是必填而非有默认值的，因为默认值等于替所有已部署网关默默决定了它们会收到哪些字节。

验证工作流把每个 profile 交给真正消费它的那个核心：`v1` 交给 5gpn `main`，`v1beta` 交给 5gpn `beta`。只对 `beta` 验证会恰好看不见这道门存在的意义——只有 `beta` 认识的字段在那里能通过，却会弄坏每一个稳定版网关。
