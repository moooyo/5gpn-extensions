# Bilibili Cleaner

License: [`GPL-3.0-only`](../LICENSES/GPL-3.0-only.txt)

This directory contains a disabled-by-default native `5gpn.io/v1` port of the
GPL-licensed `kokoryh/Sparkle` Bilibili Loon plugin. It is not compiled into
either 5gpn daemon and is not installed automatically.

Install the manifest from the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/bilibili-cleaner/extension.yaml
```

The extension captures six exact Bilibili hosts and projects the pinned five
reject rules through the reviewed routing-rule contract. It exposes the five
settings declared by the pinned Loon plugin, requests no persistent storage,
and asks for three exact network origins only for the optional airborne helper.

## Pinned upstream artifacts

The authoritative orchestration is `release/loon/plugin/bilibili.lpx` from
`kokoryh/Sparkle` commit
`70a4914d7189e0a1da4b5839ba5f60d0206edf11`. The artifact set was fetched on
`2026-07-20` and reverified on `2026-07-22`.

| Artifact | Immutable source | Size | SHA-256 | Local disposition |
| --- | --- | ---: | --- | --- |
| Loon plugin | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/release/loon/plugin/bilibili.lpx` | 6,157 bytes | `037ee4c9701f8fb7ac851d7cab817d2ba7a682bcafd0585be19ceaf09f364d74` | Authoritative settings, matchers, mocks, and script ordering |
| JSON transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/dist/bilibili.json.js` | 14,229 bytes | `42360d99c512032f312b33427178e1af3fb6d0714e2a756e2838bcdda6189dfa` | Audited alternate Surge implementation; not the Loon behavior authority |
| Protobuf request transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/dist/bilibili.protobuf.request.js` | 43,725 bytes | `b08e1c3cdd174cd75623d5c71014c13bb358d11dc1ba841a22291036fc35f5e7` | Reimplemented from preferred source in `source/native-protobuf.ts` |
| Protobuf response transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/dist/bilibili.protobuf.response.js` | 91,570 bytes | `c876c2f9272100ecec7d0df2da7a10fee327f923a856e5010ffc775548783d5d` | Reimplemented from preferred source in `source/native-protobuf.ts` |
| Live-page transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/dist/webpage.bilibili.js` | 5,608 bytes | `c42938164e4c61fcdcb0c3f25829546a98ee3bc1e60e3a7784c1862536951082` | Functional text-injection port in `inject-live-page.js` |
| Account JQ program | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/jq/bilibili.mine.jq` | 7,636 bytes | `10ca10375b19193fd280deedb7f6219cdce804ea3813ab5fa4f692d02a3238e5` | Fully mapped in `clean-json.js` |
| Tab JQ program | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/jq/bilibili.tab.jq` | 2,091 bytes | `820ef567586a069375f2853db70973a212f391ff0d9008d00fc3b06166bfde26` | Fully mapped in `clean-json.js` |
| Sparkle package metadata | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/package.json` | 733 bytes | `318e223146983263a47023435ebe85ebb4c667a14061adf8bc2e6990360d2958` | Original build-tool version evidence |
| Sparkle GPL license | `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/LICENSE` | 35,148 bytes | `8b1ba204bb69a0ade2bfcf65ef294a920f6bb361b317dba43c7ef29d96332b9b` | Governing upstream license |

The pinned Loon plugin loads its JQ and script URLs from a mutable `master`
branch. This port never loads those URLs at runtime; the immutable files above
are the reviewed behavior snapshot. The pinned JSON bundle is not referenced
by the Loon plugin. In particular, its locale-sensitive layout and
`showCreatorHub` argument conflict with the Loon JQ programs and are not mixed
into this port.

The generated Protobuf artifacts include Apache-2.0 `protobuf-ts` 2.11.1
runtime code. Its tag resolves to commit
`3f14440c5e52dd8223ac1919ad7f44e31432c667`. The pinned license is
`https://raw.githubusercontent.com/timostamm/protobuf-ts/3f14440c5e52dd8223ac1919ad7f44e31432c667/LICENSE`
— 10,140 bytes — SHA-256
`5e3400b93bbb099e83e52bab885e7441750673c21f97988ca3f1240639b63283`.

The response transformer also directs supported Bilibili clients to four
Chronos archives. The upstream script used a mutable branch, so this port pins
the bytes that existed before the Sparkle commit to
`kokoryh/chronos@a96c334eb6e46d4403740c0258d064d33321a03a`:

| Client-fetched artifact | Size | SHA-256 |
| --- | ---: | --- |
| `https://raw.githubusercontent.com/kokoryh/chronos/a96c334eb6e46d4403740c0258d064d33321a03a/ecca73e42e160074e0caf4b3ddb54a52.zip` | 1,055,273 bytes | `0ba74f51cf494ac7d470ad168d8631e6ab6eddc3578ef7898efb0a9ca2687e80` |
| `https://raw.githubusercontent.com/kokoryh/chronos/a96c334eb6e46d4403740c0258d064d33321a03a/932002070dc1b51241198a074d2279fc.zip` | 879,597 bytes | `cf7fced28a0b55f38595566bb7d067297cc51814a5c21daf8fff90c9b9dbe6c0` |
| `https://raw.githubusercontent.com/kokoryh/chronos/a96c334eb6e46d4403740c0258d064d33321a03a/8c3feda2e92bf60e8a7aeade1a231586.zip` | 879,023 bytes | `7d021dd18f8980db22dc0ac0d70df8b493e9225f4b79f24468f5949586380eee` |
| `https://raw.githubusercontent.com/kokoryh/chronos/a96c334eb6e46d4403740c0258d064d33321a03a/feaca416bbc1174b8e935cf87ff8f0b5.zip` | 1,054,471 bytes | `e96786591f4d8345577a379926377c5f21aac2d61df4cbe2a6fd7d1497ee4962` |
| `https://raw.githubusercontent.com/kokoryh/chronos/a96c334eb6e46d4403740c0258d064d33321a03a/LICENSE` | 35,149 bytes | `3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986` |

These files were verified on `2026-07-22`. They are fetched by the Bilibili
client, not by `context.network.request`. This repository does not copy or
redistribute the ZIP files because the Chronos repository does not include
their complete corresponding preferred source.

## Protobuf preferred source

`protobuf.js` is a deterministic generated bundle. It is not the sole form of
the program. Its complete preferred source and build inputs are included in
[`source/`](source/README.md):

- `native-protobuf.ts` contains the native `transform(context)` adapter and all
  request and response mutations;
- `proto/` contains all 15 pinned schema inputs;
- `generated/` contains all 15 corresponding `protobuf-ts` TypeScript outputs;
- `package.json` and `package-lock.json` pin the complete npm dependency graph;
- `buf.yaml`, `buf.gen.yaml`, `add-pure-annotations.mjs`, `tsconfig.json`, and
  `build.mjs` are the deterministic generation and bundling inputs; and
- `vendor/` retains the exact published npm archives for both embedded
  libraries;
- `vendor-src/` retains their upstream preferred TypeScript and build inputs,
  pinned by `SOURCE_MANIFEST.tsv`; and
- `licenses/` retains the Apache-2.0, MIT, and applicable protobuf.js
  BSD-3-Clause component terms.

`source/upstream-sparkle/` also retains the exact original source dependency
closure used to port the two Protobuf bundles. Every listed path uses this
immutable raw URL prefix:

```text
https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/
```

| Path below the immutable prefix | Size | SHA-256 |
| --- | ---: | --- |
| `add-pure-annotations.ts` | 1,013 bytes | `ea26a3fafae245af845aeca213235abe7f2756190cf01e1cd365cab5b7015361` |
| `build.ts` | 4,868 bytes | `e58bcbf9454fdcb51148bbbde28898682d3a69ea62b422ce2e426e37dceefaef` |
| `buf.gen.yaml` | 170 bytes | `aae392b40d5f5733f015184df1929b19b64ed165c1cba7c18e875b31e2e44f4c` |
| `buf.yaml` | 62 bytes | `6df9257f48534e841a931fe7d2fabfeb6f2fd698d3728d9f9a0f26ef5a7237b5` |
| `package.json` | 733 bytes | `318e223146983263a47023435ebe85ebb4c667a14061adf8bc2e6990360d2958` |
| `tsconfig.json` | 699 bytes | `726f4846ed612f29b30a063d98846dd3d9560bccd794594efc5f66a7d5a8498e` |
| `src/core/client.ts` | 12,056 bytes | `7e8491316a929594a1b1bd6038bb0b5033dc81db5efb6dea9e62243096c33685` |
| `src/core/entity/bilibili.ts` | 3,204 bytes | `d23b7c48df652accb80f0bb66a33b7da4351529031104d8afaabb51747c72ef1` |
| `src/core/env.ts` | 75 bytes | `9929098c90b94d75a0624a8424ac6a356d124b846d3da234617effeb62044ced` |
| `src/core/message.ts` | 3,703 bytes | `7980728ff9f455176549c021595aa0176ed0ed8532b6de04fc08a5c099ef3835` |
| `src/core/service/sponsor-block.service.ts` | 548 bytes | `8285a18765c5271955d01219ab82bbf137faa47369bf436f2c2d28bf9da27f7a` |
| `src/script/bilibili/protobuf/base.ts` | 988 bytes | `009f14de2ca4767202ff28c323e0f4d368f9578af0deb389330675b875e899ad` |
| `src/script/bilibili/protobuf/request/factory.ts` | 476 bytes | `5e50ee20bc00c2a9ce17eb25e9f4f4aa85fdd2cebbbc021848184c0ef0684c13` |
| `src/script/bilibili/protobuf/request/handler.ts` | 9,394 bytes | `12d62f506f29d800ddeefa713f38aca96be102a801fcec08cac13febc82e32a6` |
| `src/script/bilibili/protobuf/request/main.ts` | 274 bytes | `81a5b2db9625cd57c7f716db646608a08674362bd5bc267d9736a1dbc823d106` |
| `src/script/bilibili/protobuf/response/factory.ts` | 1,636 bytes | `cfbde2f96997392fea37f1dc4eb661409aa683a643dba2a942c89b51eafbacd8` |
| `src/script/bilibili/protobuf/response/handler.ts` | 13,184 bytes | `9c3267aa624fed198f6e2e4f6957774855f8af214ce0937da6f08b3280b7ef0e` |
| `src/script/bilibili/protobuf/response/main.ts` | 206 bytes | `f8ee882d5bc8e92d3799448698fbd93c3051602b6ba04150229e72f7150bb24a` |
| `src/types/client.d.ts` | 873 bytes | `252df068ca9108b978c5e1c3bdfce96e18db99d46c86caf69d69de7276ac586b` |
| `src/types/common.d.ts` | 689 bytes | `fa0fd04eda700fc2fab474530c511278fbe4b21e25be9c884a1267fb191da90c` |
| `src/types/global.d.ts` | 953 bytes | `2259faa98a0a1857f47daff6a04c4f2bdc3bbfeabea4a4f7b46480e20c494709` |
| `src/types/loon.d.ts` | 1,134 bytes | `5d61dc2d00b6fbcc7843b8d4bc3f6a0023e16d25066595cfe80294e07da002f6` |
| `src/types/quantumult-x.d.ts` | 1,465 bytes | `1340c677d29bc919f2e58728ff42260d405dec062ac7b99e2b25d3524f84f599` |
| `src/types/surge.d.ts` | 2,464 bytes | `f9c501756bb1ae231a2742e59b2ba50842a983f9838a05aec666ad0a81a9e1b0` |
| `src/utils/bilibili.ts` | 1,419 bytes | `560870af1dd370e3846c6908ffeb8949b6332ec5db2806e1d42648223917e382` |
| `src/utils/index.ts` | 2,409 bytes | `8b11de39040c272cda611d2b17bf294cae4e626731e9acce4507186867b48907` |

The schema inputs were fetched from the Sparkle commit on `2026-07-22`:

| Immutable schema source | Size | SHA-256 |
| --- | ---: | --- |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/proto/bilibili/app/card/v1/card.proto` | 349 bytes | `36f0ba3b85a65c67d15c3ea50f6eb2219353dd5c41ae6ae59b42fb1fa5c0fcbb` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/proto/bilibili/app/dynamic/v2/dynamic.proto` | 552 bytes | `82e03f0a60302466628bc26cd7371f33fefc1ccc88dfbcc3169a20e37e0b7753` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/proto/bilibili/app/interface/v1/search.proto` | 217 bytes | `c80036b21029732b468e52b7b8cc42c621e22603d2fb0995c5654817e39d96ea` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/proto/bilibili/app/interface/v1/teenagers.proto` | 235 bytes | `83b85b1c1bd96fc29ee5ad7219bcee1f5202b69bb88b65855f7fa9535650d196` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/proto/bilibili/app/playerunite/pgcanymodel/pgcanymodel.proto` | 290 bytes | `4177103b5af303f423f528a381e2f2897219b7e99354717ef1f173ab332b6b7f` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/proto/bilibili/app/playerunite/v1/player.proto` | 527 bytes | `4fab0148d3d3ee4a15075af04ad11966c17b4fa60af61e686ebd4d62dcc2eacd` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/proto/bilibili/app/playurl/v1/playurl.proto` | 432 bytes | `016100ae935f10be786b60b61f9bb40af9dcd54b82938e58a81bbf250be74a53` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/proto/bilibili/app/show/popular/v1/popular.proto` | 177 bytes | `15e413c142be474e0ac2604fd5747665cdc74d9816937b3962ea054a8d855d1f` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/proto/bilibili/app/view/v1/view.proto` | 710 bytes | `8ea3d5e2ef9012faf98c50f194dcea372eb1459fc5841e9bb871ddd189a3e7d7` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/proto/bilibili/app/viewunite/v1/view.proto` | 1,474 bytes | `cb3217ce862897c81f4c8442787c2bb9418a30f6dc0b77b83a5ca34c1936ac1d` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/proto/bilibili/community/service/dm/v1/dm.proto` | 965 bytes | `f027321b5a29fdade4a69562209c3b16f7196bf4710e7ffc2827f189f74e56e3` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/proto/bilibili/main/community/reply/v1/reply.proto` | 643 bytes | `0ed3885c40a212798b0691617028b16eec56e66b82c499e1967618f9c6384880` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/proto/bilibili/pgc/gateway/player/v2/playurl.proto` | 1,217 bytes | `fe53fd828d9abe7ec3be756f02ab110d4532342979b7ad66fbcb37aa90456525` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/proto/bilibili/playershared/playershared.proto` | 935 bytes | `23cfb49342f77f402a2c2c209ba39e102a3fa85f1bbe8d2b13303d2b0109e23a` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/70a4914d7189e0a1da4b5839ba5f60d0206edf11/proto/bilibili/polymer/app/search/v1/search.proto` | 162 bytes | `452ec59582c48f5f6346ad403c81c376a82ff13c960f276e18648e2c01466fea` |

The native build intentionally uses a smaller, locked toolchain than
Sparkle's repository-wide build:

| Package | Version | Role |
| --- | ---: | --- |
| `@bufbuild/buf` | 1.55.1 | Schema driver |
| `@protobuf-ts/plugin` | 2.11.1 | TypeScript generator |
| `@protobuf-ts/runtime` | 2.11.1 | Embedded Protobuf runtime |
| `esbuild` | 0.25.6 | Deterministic browser bundle |
| `fflate` | 0.8.2 | Embedded bounded gzip frame decoding |
| `typescript` | 5.8.3 | Source validation |

All registry URLs and package integrity values are fixed in
`source/package-lock.json`.

| Embedded component source | Size | SHA-256 |
| --- | ---: | --- |
| `https://registry.npmjs.org/@protobuf-ts/runtime/-/runtime-2.11.1.tgz` | 54,285 bytes | `3bb18cb373565b5c95e466c1db76e4b1d8166b62276a15e3547c36f9e25b502b` |
| `https://registry.npmjs.org/fflate/-/fflate-0.8.2.tgz` | 168,507 bytes | `61fd5061e2fc8e5e3e3129f7f2fec7bd78a313e1bf4becbf1cc1cc9998d141dc` |
| `https://raw.githubusercontent.com/101arrowz/fflate/d3243651cb142e3e04f3e4bc037b9e985878f444/LICENSE` | 1,069 bytes | `805f6cb28bb8b6d3a0badd83c93bccd9671fa01a3b4b92b7042b0743325ac243` |

These component files were fetched on `2026-07-22`. The `protobuf-ts`
license URL and digest are recorded above. Their preferred-source inventory is
stored in `source/vendor-src/SOURCE_MANIFEST.tsv`. Paths below `fflate/` map to:

```text
https://raw.githubusercontent.com/101arrowz/fflate/d3243651cb142e3e04f3e4bc037b9e985878f444/
```

Paths below `protobuf-ts/` map to:

```text
https://raw.githubusercontent.com/timostamm/protobuf-ts/3f14440c5e52dd8223ac1919ad7f44e31432c667/
```

The manifest records every preferred-source path, byte size, and SHA-256.
Rebuild with:

```powershell
Set-Location bilibili-cleaner/source
npm ci
npm run generate
npm run build
npm run verify:sources
```

The expected bundle is 237,494 bytes with SHA-256
`7e125ea7868bc4de730073c8f2c21876d3df01cc9efb5b33da9eec2f2829e662`.
The build contains no timestamp or absolute source path. No toolchain or
`node_modules` directory is installed on the gateway.

## License and attribution

Sparkle's `package.json` identifies `kokoryh` as author, and the repository is
licensed under GNU GPL version 3. No “or later” grant is supplied, so this
extension uses the conservative SPDX identifier `GPL-3.0-only`.

The native JavaScript, native TypeScript, schema-derived generated TypeScript,
and final combined bundle are distributed under `GPL-3.0-only`. The bundle
also incorporates Apache-2.0 `protobuf-ts` runtime material and MIT `fflate`
material; their component notices and source inputs remain available beside
the GPL preferred source. The published `protobuf-ts` runtime package declares
`(Apache-2.0 AND BSD-3-Clause)` because `protobufjs-utf8` carries BSD terms.
`source/bundle-inputs.json` proves that file is removed from this bundle by
tree shaking; its preferred source and BSD terms are nevertheless retained.

KeleeOne mirrors several Sparkle files and was only a discovery catalog. Its
repository-level CC license cannot replace Sparkle's original GPL license, so
no KeleeOne CC claim applies to this directory.

## Port mapping

| Pinned Loon behavior | Native 5gpn mapping |
| --- | --- |
| Six MITM hosts | Six exact `traffic.captureHosts`; every action owns only hosts inside that set. |
| Five LPX reject rules | Four exact-domain rejects plus `AND(DOMAIN-SUFFIX chat.bilibili.com, OR(stun, tracker))` as one typed rule. |
| Five plugin arguments | Five required typed settings with the pinned defaults. |
| Request mocks | Request-phase synthetic JSON or gRPC responses, without contacting the original endpoint. |
| `/pgc/page/channel` rewrite | Strictly rewrites only an interior `&mobi_app=iphone&` parameter. |
| JSON and JQ response operations | Full pinned Loon JQ behavior in `clean-json.js`, including account layouts and conditional VIP promotion. |
| Protobuf response transformer | All 13 effective handlers and the one pinned matcher no-op in `protobuf.js`. |
| Airborne DmSeg request transformer | Synchronously replays the captured RPC and queries the approved SponsorBlock origin before returning a synthetic response. |
| Live-page DOM transformer | Injects the pinned client-side tree traversal into `<head>` without requiring sandbox `DOMParser`. |
| Proxy-client globals | Removed in favor of `transform(context)`, typed settings, explicit binary bodies, console logging, and origin-scoped synchronous network calls. |

The three gRPC request mocks preserve their pinned binary frames and return an
explicit `Grpc-Status: 0` trailer. Protobuf
response handling preserves unknown fields and gRPC trailers, accepts the
pinned single-frame gzip convention, and always emits one uncompressed gRPC
frame with a corrected length prefix. Airborne synthetic responses return the
trailers received from the replayed RPC. Gzip input is streamed in one-KiB
chunks and rejected once the decompressed Protobuf message exceeds eight MiB.

## Network permission and data disclosure

The airborne helper is the only script behavior that performs outbound HTTP.
It requires exactly:

```text
https://app.bilibili.com
https://bsbsb.top
https://grpc.biliapi.net
```

The first and third origins replay the original captured DmSeg request on its
original Bilibili host. This includes the request body and reviewed headers.
The replay preserves the protocol-required exact `TE: trailers` header while
removing every other hop-by-hop header.
The `bsbsb.top` request sends the derived BV identifier, content ID, and the
fixed `category=sponsor` query. Enabling the extension requires an operator
confirmation naming every origin and warning that all data visible to the
script can be sent there.

Every call returns through authenticated mihomo SOCKS5. The extension has no
ambient `fetch`, cookie jar, redirect following, DNS, socket, filesystem,
process, timer, or module-loader access. It declares no persistent storage and
cannot select an egress group.

## Deliberate architecture boundary and remaining differences

- The LPX `[Rule]` domain rejects are represented as typed routing rules rather
  than capture hosts or script behavior. The four exact rules plus one
  compound `AND(suffix, OR(keyword))` rule activate only with the reviewed
  extension snapshot; `stun` and `tracker` are not independent global rules.
- Loon exposes a device-model environment value. Native scripts do not. The
  `showUpList` iPad exception uses the Bilibili `bili-hd` user-agent prefix,
  which is the closest bounded signal available in `context.request.headers`.
- Loon performs its two airborne requests concurrently with a three-second
  timeout. Native network calls are synchronous and have fixed process-wide
  five-second, one-MiB, call-count, and concurrency limits. A slow or oversized
  replay falls back to the original request.
- Sponsor segment data from `bsbsb.top` is mutable external data. Network,
  status, parse, or schema failure preserves normal Bilibili behavior.
- The pinned response transformer used a mutable Chronos branch. This port
  changes only the URL revision to the immutable commit recorded above and
  does not fetch, copy, or redistribute those ZIP files.
- The live-page port injects the same browser-side behavior but does not
  reproduce `DOMParser`'s whole-document serialization. It intentionally
  preserves the upstream `hostname.includes("bilibili")` test.
- Native request and response bodies remain bounded. Reviewed JSON, Protobuf,
  and remote-data decode failures return no patch, preserving the original
  flow like the pinned scripts. VM timeouts, invalid result objects, and other
  runtime-contract violations still fail the matched flow closed.

## Updating from upstream

1. Select one new `kokoryh/Sparkle` commit intentionally and keep the Loon LPX
   as the orchestration authority.
2. Fetch the LPX, both JQ programs, all audited dist files, every schema and
   preferred-source file, `package.json`, and `LICENSE` from commit-pinned raw
   URLs. Record size, SHA-256, and fetch date for every file.
3. Recheck the original repository license and every embedded generated
   dependency; never use a mirror's root license to relabel original code.
4. Diff settings, matchers, request mocks, JSON/JQ behavior, Protobuf schemas,
   handler mutations, DOM behavior, outbound requests, and client-visible URLs
   independently.
5. Regenerate `source/generated/`, rebuild `protobuf.js`, verify the deterministic
   digest, and review the dependency lock diff before accepting it.
6. Keep action hosts inside `captureHosts`. Declare every new script-side
   origin exactly and require a fresh operator risk confirmation.
7. Update fixtures, provenance, limitations, notices, SPDX annotations, and
   `metadata.version` in the same change.

## Validation

Run:

```powershell
npm test
node tests/bilibili-fixtures.mjs
npm run verify:upstreams

Set-Location bilibili-cleaner/source
npm ci
npm run generate
npm run build
npx tsc --noEmit
npm run verify:sources
```

Then confirm six capture hosts, five routing rules, twelve actions, five
settings, three exact network origins, no storage permission, and no
proxy-client compatibility global. Exercise JSON/JQ, synthetic response, HTML
injection, all 13 effective
Protobuf handlers, the matcher no-op, gzip framing, unknown-field preservation,
airborne success/failure, disabled settings, and malformed bodies.
