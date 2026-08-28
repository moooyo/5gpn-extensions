# 5gpn 扩展

[English](README.md) | 简体中文

本仓库是独立维护的原生 5gpn 扩展的第一方目录。5gpn 核心仓库负责运行时和严格的
`5gpn.io/v1` 契约；它不会将扩展源代码纳入仓库或镜像化。

每个扩展导入后默认处于禁用状态。每个已安装扩展也始终恰好具有一个显式的运营者出口绑定，全新导入从 `DIRECT` 开始。启用前，请审查其不可变清单、脚本、捕获主机、精确路由规则、联网权限、执行位置、当前出口绑定，以及任何 `requirements.egressGroup.required` 审查标记。

| 扩展 | 用途 | 许可证 |
| --- | --- | --- |
| `bilibili-cleaner` | 移除部分哔哩哔哩广告和推广内容 | GPL-3.0-only |
| `testflight-region-unlock` | 使用运营者选择的出口改写 TestFlight 店面 | CC BY-NC-SA 4.0 |
| `weatherkit` | 在 Script 模式运行经审查的 WeatherKit bundle，或在 Cloud 模式应用经审查的上游改写 | Apache-2.0 |
| `youtube-cleaner` | 清理 YouTube 响应并准备经审查的外部 Onesie 播放链路 | Apache-2.0 |
| `zhihu-cleaner` | 移除部分知乎传输配置、广告、推广内容和导航入口 | CC BY-NC-SA 4.0 |

## 安装

通过 5gpn Console 的 **Install from URL** 操作，使用所需目录中原始
`extension.yaml` 的 URL。本公共目录可经网关访问，无需凭据。对于私有分支，请使用 Console 的本地添加/上传流程，或通过运营者控制的公共 HTTPS 源发布经审查的文件；绝不要在扩展 URL 中嵌入仓库凭据。

| 扩展 | 清单 URL |
| --- | --- |
| `bilibili-cleaner` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/bilibili-cleaner/extension.yaml> |
| `testflight-region-unlock` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/testflight-region-unlock/extension.yaml> |
| `weatherkit` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/weatherkit/extension.yaml> |
| `youtube-cleaner` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/youtube-cleaner/extension.yaml> |
| `zhihu-cleaner` | <https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/zhihu-cleaner/extension.yaml> |

每次导入均从禁用状态开始，并获得显式的 `DIRECT` 出口绑定。启用前，请审查不可变快照、捕获主机、操作、设置、精确路由规则、联网权限、执行位置和当前运营者出口绑定。`requirements.egressGroup.required` 仅是审查元数据，绝不会产生未绑定状态。安装扩展不会启用全局拦截总开关，也不会在设备上信任其拦截 CA。

## Marketplace

第一方 marketplace 以严格 JSON 发布于：

```text
https://moooyo.github.io/5gpn-extensions/marketplace/v2/index.json
```

该 URL 已编译进 5gpn，是其唯一的 marketplace 来源。不存在由运营者配置的市场：此来源无法更改、替换、重命名、禁用，也无法再添加其他来源；Console 无需先添加任何东西即可浏览它。

Console 可直接浏览其中已审查的扩展。浏览不会安装、启用、更新或执行任何扩展。选择条目后会进入标准的原生 manifest 解析与快照流程，并审查其捕获主机、权限、设置、路由规则、执行位置和出口绑定。全新安装从禁用状态开始；已安装的 Marketplace 替换保留此前的启用授权。

作为内置来源并不等于替你做出了信任决定。从中安装任何内容前，请先审查本仓库以及每个条目的 manifest。对于发布在其他位置的、经审查的 manifest，Install from URL 和 Console 的本地添加流程依然可用。

Marketplace 是发现元数据，不是可执行信任边界。每个条目都指向生成索引的精确 40 位仓库提交中的 manifest、文档和许可证。生成器只记录 manifest 的 SHA-256、字节数，以及网关会在审查时核对的面向人的能力摘要；它不发布与运行时并行的脚本资源或已编译策略契约。脚本和路由规则仍由常规不可变快照流程抓取、解析和编译。审查返回完整快照摘要，应用时重新抓取；快照变化即拒绝。列表中的描述和能力摘要永远不是运行时权威。

GitHub Pages 在上述稳定 URL 提供当前列表。公开 JSON Schema 位于
<https://moooyo.github.io/5gpn-extensions/marketplace/v2/schema.json>。
当仓库存在具备 Pages 写权限的 `PAGES_ENABLEMENT_TOKEN` secret 时，固定版本的 Pages action 会尝试首次启用站点。如果组织策略禁止该 token 或自动启用，唯一的手工前置是在 **Settings → Pages** 中进行一次设置，将 Source 选择为 **GitHub Actions**；无需手工维护发布分支或生成站点。

## 开发扩展

规范性运行时契约见核心项目的
[`5gpn.io/v1` author guide](https://github.com/moooyo/5gpn/blob/main/docs/native-extensions.md)。本节是本目录中扩展维护者可独立使用的检查清单。5gpn 仅接受此处说明的原生清单格式；请勿发布 Loon、Surge、Quantumult X 或 Stash 清单。`proxy-compat` 仍是原生格式的一部分：它使用核心提供的沙箱，而不是由扩展携带兼容 runtime 或全局对象。

### 目录结构

每个顶层目录只保留一个可独立安装的扩展：

```text
example-cleaner/
  extension.yaml
  clean-response.js
  README.md
```

`extension.yaml` 和每个仓库本地脚本都必须是目录中的不可变文件。经审查的远程脚本源应使用不可变提交 URL；如果上游只通过官方 release asset 发布生成 bundle，也正式支持直接使用该 asset URL，但必须记录 tag 对象、源码提交及其可替换性。README 必须记录适用许可证、创作者署名、每个上游源绑定、URL、获取日期、移植决策、排除项、限制、更新流程和验证步骤。不要在 README 中另行维护字节大小或摘要 pin。

### 可用能力

| 能力 | 清单声明 | 运行时效果与边界 |
| --- | --- | --- |
| 获取流量 | `traffic.captureHosts` | 精确 DNS 名称或受限的 `*.example.com` 通配符。这是唯一的流量获取权限，启用时会为端口 80 和 443 上的明文 HTTP 和 TLS/H1/H2 发布 DNS、证书和 mihomo 规则。不支持 HTTP/3 拦截。 |
| 应用已审查的全局路由 | `traffic.routingRules` | 有界类型化选择器只能对已经到达网关的命中流量执行 `REJECT` 或 `DIRECT`。精确规则与插件共用一次启用确认，不能命名代理组，且仅在插件和 MITM 总开关均启用时存在。 |
| 转换请求或响应 | `actions[]` | 有序的结构化匹配器在声明的阶段选中一个动作。每个动作主机都必须属于同一扩展的 `captureHosts`。 |
| 拦截匹配的路径 | `script.reject` | 在请求发往上游之前中止。无代码。 |
| 返回固定响应 | `script.mock` | 声明状态码、响应头,以及 `body` 或 `base64Body`。无代码,且请求不会离开网关。 |
| 改写 JSON 响应体 | `script.jq` | 直接携带上游模块自己的 `response-body-json-jq` 表达式,由 gojq 执行,完全不进 JavaScript 运行时。可通过 `$settings` 读取操作员选择。 |
| 在真实报文上编辑头部 | `script.headers` | `set` 与 `remove` 两个字段，不替换正文。先执行删除。 |
| 把请求发往别处 | `script.rewrite` | 原地改写 URL，或直接返回 302/307。`to` 可以插值 `{{settings.key}}`，上游模块的端点参数就是这样被移植过来的。捕获主机边界内的同源改写无需联网授权；跨源改写需要该授权，并会转发完整 method、解码后的 body 和端到端 headers，其中可能包含 `Cookie` 或 `Authorization`。 |
| 编辑正文字节 | `script.replaceBody` | 一个正则和一个替换串，替换串可读取 `{{settings.key}}`，并可选地经由声明的 `valueMap` 解析。与 `jq` 不同，它不解析文档，因此未命中的字节原样保留。 |
| 用设置开关一个动作 | `actions[].enabledWhen` | 对同一扩展的一个必填设置做 `{key, equals}` 比较。比较不成立时该动作根本不会被编译，因此永远不会命中。因此一个 select 可以驱动多组互斥动作，而两个布尔做不到——它们有"两个都开"的第四种状态。上游插件格式是在脚本之外开关一个条目的，所以携带这种开关的 bundle 从来不会读取控制它的那个键。 |
| 运行已发布的代理客户端 bundle | `script.entry: proxy-compat` | 以 Loon 人格加载钉住的上游脚本。见下文的契约。 |
| 读取正文 | `script.bodyMode` | `none`、UTF-8 `text`，或以 `Uint8Array` 表示的 `binary`，并受 `maxBodyBytes` 限制。 |
| 类型化运营者配置 | `settings[]` | `text`、`select`、`boolean`、`number` 和 `location`；启用前必须完整填写必填值。 |
| 持久状态 | `permissions.persistentStorage: true` | 添加受扩展作用域和配额限制的 `context.storage`；脚本绝不能选择路径或访问文件系统。 |
| 出站 HTTP | `permissions.network: true` | 添加 `context.network.request`、其并发形式 `context.network.requestAsync`，以及允许跨源请求改写的例外。它不指名任何主机：持有该权限的扩展可以访问它能解析的任意地址，并可发送脚本可见的任何请求、响应、设置或存储数据。不存在环境级 `fetch`、重定向跟随、Cookie jar 或套接字访问，URL 规范化以及对 IP 字面量和不安全主机的拒绝仍然生效。 |
| 选择被拦截流量的上游或解析器 | `traffic.upstreamMappings` | 地址（`1.2.3.4`）或别名（`origin.example.net`）会改变拦截引擎的上游目标，同时保留原始 HTTP Host 和 TLS SNI；别名会在规则选择前解析、接受安全检查并固定地址。`server:` 目标则选择最多四个 monolith 解析器上游规格（明文 UDP 的 `IP[:port]`、DoT 的 `name@IP[:port]`，或 DoH 的 `https://host/path@IP[:port]`），绝不会作为源站拨号。所有获准连接仍会经过当前受保护规则和该扩展的显式出口绑定；映射绝不选择出口。 |
| 标记出口需要审查 | `requirements.egressGroup.required: true` | 仅为审查元数据。每个已安装扩展本来就恰好具有一个显式绑定，全新导入默认为 `DIRECT`；该标记只在不可变 manifest 与 snapshot 中记录这项依赖，不会改变默认值或产生另一种绑定状态。扩展不能命名、检查、选择或更改组。已选择的组若消失，其名称会保留且流量以拒绝方式失败；另行审查的路由规则仍只能选择 `DIRECT`。 |
| 组合多个扩展 | Console 执行顺序 | 请求和响应操作自上而下运行。对于重叠目的地，同一顺序中的第一个匹配扩展的显式出口绑定和第一条全局路由规则生效。重排需要审查调整前后顺序并确认。 |

原生拦截仅支持明文 HTTP 和 TLS/H1/H2。能够从 HTTP/3 回退的客户端可以重试 TCP 并进入捕获路径；仅支持 H3 的客户端会失败。由核心拥有的 UDP/443 防护规则不是扩展能力。

脚本可以使用受限且仅作用于当前 action 的计时器，但不会获得文件系统、进程、模块加载器、原始套接字、环境级 DNS、环境级 Go 对象或不受限制的网络访问。所有上游 TCP 和 UDP 均经由 mihomo 的进程内 inner dialer 返回；扩展不能绕过运营者选择的出口路径。

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

### 操作类型

一个操作只使用一种执行形式。其中六种是永远不会进入 JavaScript 运行时的声明式形式：`reject`、`mock`、`jq`、`headers`、`rewrite` 和 `replaceBody`。脚本操作则必须在 `source` 与 `inline` 中恰好声明一个；其 `entry` 默认为 `native`，也可为经审查的上游代理客户端 bundle 显式声明 `proxy-compat`。`proxy-compat` 是正式支持的执行形式，不是历史例外；当声明式操作无法忠实表达已发布行为时可以使用它，能够等价表达时仍应优先选择声明式形式。本目录同时使用两者，不包含仓库本地 JavaScript，也不携带扩展自建的兼容 runtime。

```yaml
script: { reject: true, bodyMode: none, timeoutMs: 500, maxBodyBytes: 1024 }
script: { mock: { status: 200, headers: { Content-Type: application/json }, body: '{}' }, bodyMode: none, ... }
script: { jq: 'del(.data.ad_info)', bodyMode: text, ... }
script: { source: https://…/pinned.js, entry: proxy-compat, bodyMode: text, ... }
```

### 脚本契约

原生脚本形式（`entry: native`，也是默认值）仍受支持并接受同等审查，但本仓库目前没有使用它。其源码只定义一个全局入口点：

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
context.network.requestAsync
```

请求操作可以返回请求补丁、合成响应、`{abort:
true}`、`null` 或 `undefined`。响应操作只能返回响应补丁、中止或不作更改。改写后的 URL 必须保持在所属扩展的捕获主机边界内，除非已确认的联网授权允许跨源目标；同源改写不需要该授权。未知结果字段和未捕获的脚本错误会使匹配流以拒绝方式失败（fail closed）。

响应操作和合成响应可以包含有界 `trailers` 补丁；请求补丁不能创建 trailer。运行时会校验名称、值、字段数、单值大小和总字节数，并拒绝 framing 等禁止字段。引擎会在 HTTP/1.1 和 HTTP/2 上正确声明并发布有效的 HTTP/gRPC trailer；不支持 HTTP/3 下游拦截。

仅在声明了持久存储时，`context.storage` 才存在。仅在声明并确认联网权限时，`context.network.request` 和 `context.network.requestAsync` 才存在。网络响应包含 `url`、`status`、`headers`、`trailers`、二进制 `body`，以及当正文是有效 UTF-8 时的 `text`。重定向和非 2xx 响应会返回给脚本，而不会被静默跟随。

原生 action 和 proxy-compat action 都可以使用有界、仅作用于当前 action 的 `setTimeout`、`setInterval`、`clearTimeout` 和 `clearInterval`。每个 action 的计时器数量受限，action 截止时间会终止该 action；超过截止时间的计时器不会被提前触发。

### proxy-compat 契约

`script.entry: proxy-compat` 是在原生清单中原样运行已发布代理客户端 bundle 的正式支持形式。兼容表面由核心拥有；扩展只提供经审查的源码、阶段、匹配器、设置、权限和执行边界，不得携带兼容垫片或定义额外的客户端全局对象。

每次使用都必须接受与原生移植相同的审查：记录不可变源码溯源和权威模块，映射每个匹配器与设置，只在实际使用时声明存储和全局联网权限，记录数据披露和有意排除项，遵守上游许可证边界，并在 fixture 中固定动作到 bundle 的精确映射、`bodyMode`、超时和正文大小上限。

运行时以 **Loon** 人格呈现：`$loon` 有定义，因此按 `$task`、`$loon`、`$rocket`、`Egern`、`$environment["surge-version"]` 这一固定顺序探测的 bundle 会走它们的 Loon 分支。运行时不定义任何 Surge、Quantumult X 或 Egern 全局，`$environment` 报告的是 `loon-version` 而不是 `surge-version`。

bundle 可以拿到：

```text
$loon             人格版本字符串
$environment      { "loon-version": … }
$script           { startTime }
$request          { url, method, headers, body? }
$response         { status, headers, body }，请求阶段为 undefined
$argument         清单的类型化设置，以解码后的对象形式给出
$done(result)     完成信号；以第一次调用为准
$persistentStore  read(key) / write(value, key)，需要存储权限
$httpClient       get|post|put|delete|head|patch(options, cb)，需要网络权限
$utils            仅有 ungzip；其余一律缺失，使得 bundle 取用未实现的
                  helper 时会大声失败而不是静默产出错误结果
$notification     post(...)，记入该动作自己的日志预算而非真的投递，
                  因为网关没有投递渠道
```

`$argument` 是**对象**而不是序列化字符串，因为 Loon 就是这样交给 bundle 的。这也是为什么设置、类型和默认值都从上游的 `[Argument]` 段推导，而不是从 Surge 的 `#!arguments` 行：Loon 的是类型化的，声明为 `number` 的设置到达时仍然是 number。一个错误解析 `$argument` 的 bundle 不会报错，它会静默地按自己的默认值运行。

动作在 bundle 调用 `$done` 时结束。始终不调用的 bundle 会一直跑到动作截止时间然后失败。运行时没有模块加载器；bundle 里的 `require` 只在它永不选择的 Node.js 分支上才会到达。

### 声明可选权限

仅声明运行时实现实际使用的能力：

```yaml
permissions:
  persistentStorage: true
  network: true

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

联网权限是一个布尔值，不携带源列表。请求 URL 仍会被规范化；userinfo、片段、IP 字面量、localhost、私有目标和其他不安全目标会被拒绝。捕获主机边界内的同源改写无需授权；跨源改写需要授权，并会发送完整 method、解码后的 body 和端到端 headers，其中可能包含 `Cookie` 或 `Authorization`；framing 与 hop-by-hop 字段仍由运行时拥有。

上游映射仅适用于已由同一扩展拥有的主机。地址或别名会在保留原始 Host 和 SNI 的同时改变引擎上游；`server:` 目标会被解析为解析器上游，绝不会用作源站目标。不安全地址会以拒绝方式失败，两种形式都不会选择出口。`requirements.egressGroup.required` 只记录审查元数据：每次安装都有显式绑定，全新导入从 `DIRECT` 开始。

### 开发和审查流程

1. 选择权威上游仓库和不可变提交。不得将扩展商店或镜像的根许可证视为比更具体的原始文件许可证更有权威性。
2. 移植行为前，记录并验证每个源文件和许可证文件的不可变原始 URL、获取日期、创作者署名和许可证。对于仅以官方 release asset 提供的生成 bundle，还要记录直接 asset URL、tag 对象、源码提交及 release 的可变状态。不要另加手工维护的字节大小或摘要 pin。
3. 仅将经审查的行为转换为严格的原生清单。能够忠实表达时优先使用声明式操作；否则通过 `entry: proxy-compat` 使用绑定到不可变提交或有完整记录的官方 release asset 的经审查上游 bundle。缩小捕获主机和匹配器，而不是保留宽泛的客户端专用模式。
4. 仅在使用时声明存储、联网权限、上游映射和所需出口审查元数据。记录获准的网络调用或跨源改写可能泄露哪些已解密数据，包括完整 method、解码后的 body 和端到端 headers。
5. 添加正向、无操作、格式错误输入和边界测试样例。保留无关字段，并在部分转换不安全时以拒绝方式失败（fail closed）。
6. 运行目录验证器和 marketplace 可复现性门禁：

   ```powershell
   npm ci
   if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE" }
   npm test
   if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
   ```

   涉及运行时的变更还必须运行 [`MIGRATION.md`](MIGRATION.md) 所述、固定到安装器 mihomo 版本的完整审查语料库。它会审查每个条目、抓取真实脚本资源，并用运营者当前获得的 monolith 源码编译完整候选项。

7. 在禁用状态下安装候选项，检查其源码 revision 和权限摘要，配置必需设置并审查显式出口绑定（全新安装为 `DIRECT`），然后仅在已授权的测试设备上启用它，且该设备已信任共享拦截根证书。

更新必须保持 `metadata.id`，当运行时来源或经审查的 asset 选择变化时提升 `metadata.version`，并刷新溯源信息和测试样例。全新安装从禁用状态开始；已安装的 Marketplace 替换无需先禁用，并保留此前的启用授权。请勿引入自动更新、未经审查的可变分支获取或扩展自带的兼容性垫片。

上游版本的选择刻意保持为人工流程。每次源码迁移、已安装版本发布和回滚都必须遵循可复用的 [`MIGRATION.md`](MIGRATION.md) 手册。该手册要求记录基线与候选版本、比较能力和许可证、明确状态策略、通过 Marketplace 审查/应用边界完成更新、完成聚焦验证、明确记录外部 monolith 契约证据，并准备由发布者管理、可演练的前滚式回退。由于 marketplace 来源已编译进 5gpn，没有任何运营者能控制来源；手册说明在发布者回滚可用之前，已安装扩展出现故障的运营者仅有的有限应急选项。该手册不会发现或自动选择上游版本。

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
$marketplacePath = Join-Path $env:TEMP ("5gpn-extensions-marketplace-" + [guid]::NewGuid().ToString('N') + '.json')
try {
  npm run marketplace:build -- --revision 0000000000000000000000000000000000000000 --output $marketplacePath
  if ($LASTEXITCODE -ne 0) { throw "marketplace build failed with exit code $LASTEXITCODE" }
  npm run marketplace:build -- --revision 0000000000000000000000000000000000000000 --check $marketplacePath
  if ($LASTEXITCODE -ne 0) { throw "marketplace check failed with exit code $LASTEXITCODE" }
} finally {
  [System.IO.File]::Delete($marketplacePath)
}
```

验证门禁检查清单结构、本地脚本引用、捕获主机所有权、JavaScript 语法、禁止的扩展自定义兼容性全局对象、上游溯源文档及每个扩展的行为测试样例。

Marketplace 生成器只读取本地已审查的元数据、manifest、许可证文本和文档。名称、版本、描述、manifest SHA-256、字节数和能力摘要均在本地派生；生成器不执行任何网络请求。每个 manifest、文档和许可证 URL 都使用传入的提交 revision 寻址。对于同一个 revision，输出是确定的。生成器会创建不存在的 `--output` 父目录，`--check` 则要求逐字节完全一致。fixture 测试会编译公开的 Draft 2020-12 schema，并使用它校验真实生成的目录。

CI 另行检出安装器 pin 背后的精确 mihomo 源码提交，让每个生成条目通过 Marketplace 审查、快照构造、完整配置校验以及真正的 goja/gojq 编译器。该集成门禁刻意真实抓取第三方绝对脚本 URL，因此并非 hermetic；无法抓取或编译经审查的实时依赖时，发布会失败。Pages 只发布验证成功且仍为当前 `main` 的提交；较新的 `main` 会取消或阻断旧 artifact 的部署。

该构建产出一份文档、描述一套 wire contract，发布在 `marketplace/v2/`。monolith 会宽松忽略未知 catalog 字段，但本发布者只输出运行时实际消费的字段：manifest 身份、展示元数据，以及审查时核对的能力摘要。已退役的资源列表和类型化策略投影不会作为装饰性或竞争性契约保留。未来若更改运行时实际消费的字段，必须使用新的发布路径，而不是构建 profile。

当前集成 pin 是 `moooyo/mihomo@60a0a04ff5dc794fcb1a31512cbaf5431dc6b7a3`，即安装器 `v1.19.30-monolith.36` artifact 背后的源码提交。安装器升级时，必须在同一变更中更新此精确提交与 workflow。不得换成分支或可移动 tag，也不得把 `npm test` 或 marketplace 可复现性本身描述为运行时验证。
