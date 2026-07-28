# Bilibili Cleaner

License: [`GPL-3.0-only`](../LICENSES/GPL-3.0-only.txt)

This directory contains a disabled-by-default native `5gpn.io/v1` port of the
GPL-licensed `kokoryh/Sparkle` Bilibili Loon plugin. It is not compiled into
either 5gpn daemon and is not installed automatically.

Install the manifest from the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/bilibili-cleaner/extension.yaml
```

The extension captures six exact Bilibili hosts, projects the pinned five
reject rules through the reviewed routing-rule contract, and requires an
operator-selected mihomo egress group for the upstream `bsbsb.top,PROXY`
requirement. It exposes the five settings declared by the pinned Loon plugin,
requests no persistent storage, and asks for three exact network origins for
the SponsorBlock and request-optimization helpers.

## Pinned upstream artifacts

The authoritative orchestration is `release/loon/plugin/bilibili.lpx` from
`kokoryh/Sparkle` commit
`12e89d6d93d72d39eb283ef81d2b58eb204cdb58`, committed on `2026-07-20`.
The artifact set was fetched and verified on `2026-07-22`.

| Artifact | Immutable source | Size | SHA-256 | Local disposition |
| --- | --- | ---: | --- | --- |
| Loon plugin | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/release/loon/plugin/bilibili.lpx` | 6,966 bytes | `07f9c95c3e1fd511b50c0fab790a023415945ca322fb66927266c60f666ea1c6` | Authoritative settings, matchers, mocks, rules, and script ordering |
| JSON transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/dist/bilibili.json.js` | 19,068 bytes | `5d3e6ecdbdc301f55e68e08185a9d00a70e13d2c48858ff9c6f7e3ca303bcfa7` | Live-response behavior used by the LPX is ported in `clean-json.js`; unrelated application routes remain excluded |
| Protobuf request transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/dist/bilibili.protobuf.request.js` | 62,893 bytes | `3902dc936736125d18d3c3da1d5564832d5fe80bb4d2df041f51cf16d80c3da1` | Reimplemented from preferred source in `source/native-protobuf.ts` |
| Protobuf response transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/dist/bilibili.protobuf.response.js` | 94,862 bytes | `e5989151c9e0a51a835a651543e903af287604a11d70368e043f3528939092ea` | Reimplemented from preferred source in `source/native-protobuf.ts` |
| Webpage transformer | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/dist/webpage.bilibili.js` | 5,033 bytes | `13e98f5443a5ca85ddb7e8088f0a44d16bde11ee4c8668f26d83f80515fcc0d6` | Functional text-injection port in `inject-live-page.js` |
| Account JQ program | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/jq/bilibili.mine.jq` | 7,636 bytes | `10ca10375b19193fd280deedb7f6219cdce804ea3813ab5fa4f692d02a3238e5` | Fully mapped in `clean-json.js` |
| Tab JQ program | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/jq/bilibili.tab.jq` | 2,091 bytes | `820ef567586a069375f2853db70973a212f391ff0d9008d00fc3b06166bfde26` | Fully mapped in `clean-json.js` |
| Sparkle package metadata | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/package.json` | 769 bytes | `b98a8915af5a85c681e21cdb973a739083ebf25001e0c0df3d6ab459666f878e` | Original dependency and build-tool version evidence |
| Sparkle GPL license | `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/LICENSE` | 35,148 bytes | `8b1ba204bb69a0ade2bfcf65ef294a920f6bb361b317dba43c7ef29d96332b9b` | Governing upstream license |

The LPX loads JQ and generated script URLs from mutable `master`. This port
never loads them at runtime; every behavior above is reviewed against the
immutable commit. The LPX now uses the JSON bundle only for the three live
response families. Its separate locale-sensitive account implementation and
`showCreatorHub` argument are not LPX behavior and remain deliberately
excluded; account and tab responses continue to follow the pinned JQ programs.

## Chronos client artifacts

The response transformer directs supported Bilibili clients to Chronos
archives. The upstream script uses a mutable branch, so every client-visible
URL is changed only at the revision component and pinned to the current
`kokoryh/chronos` commit
`69a8996b1f1311b606021e3f194b0390280ab618`, committed on `2026-07-04`.
These files were verified on `2026-07-22`.

| Client-fetched artifact | Size | SHA-256 |
| --- | ---: | --- |
| `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/e5a968f1a5055bbe5c12e67b100a6dcb.zip` | 983,408 bytes | `c82d74ac16e2d1ecb82f8f3d3cab2fc9fe5cc49d243964a9bd4a3877a642056e` |
| `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/ecca73e42e160074e0caf4b3ddb54a52.zip` | 1,055,273 bytes | `0ba74f51cf494ac7d470ad168d8631e6ab6eddc3578ef7898efb0a9ca2687e80` |
| `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/f993a054969a4f6ae6b20a65f1292e47.zip` | 965,523 bytes | `e22e06e114cbeb5bc749887d8eee4018832f0e7b4508979e9606a5a432cd3c02` |
| `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/feaca416bbc1174b8e935cf87ff8f0b5.zip` | 1,054,471 bytes | `e96786591f4d8345577a379926377c5f21aac2d61df4cbe2a6fd7d1497ee4962` |
| `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/932002070dc1b51241198a074d2279fc.zip` | 879,597 bytes | `cf7fced28a0b55f38595566bb7d067297cc51814a5c21daf8fff90c9b9dbe6c0` |
| `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/8c3feda2e92bf60e8a7aeade1a231586.zip` | 879,023 bytes | `7d021dd18f8980db22dc0ac0d70df8b493e9225f4b79f24468f5949586380eee` |
| `https://raw.githubusercontent.com/kokoryh/chronos/69a8996b1f1311b606021e3f194b0390280ab618/LICENSE` | 35,149 bytes | `3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986` |

The archives are fetched by the Bilibili client, not by
`context.network.request`. This repository does not copy or redistribute them
because the Chronos repository does not include their complete corresponding
preferred source.

## Protobuf preferred source

`protobuf.js` is a deterministic generated bundle. Its complete preferred
source and build inputs are included in [`source/`](source/README.md):

- `native-protobuf.ts` contains the native `transform(context)` adapter and all
  request and response mutations;
- `proto/` contains all 15 pinned schema inputs;
- `generated/` contains all 15 corresponding `protobuf-ts` outputs;
- `package.json` and `package-lock.json` pin the npm dependency graph;
- the generation and bundling inputs are retained beside the adapter;
- `vendor/` retains the exact published runtime archives;
- `vendor-src/` retains the embedded components' preferred TypeScript source;
  and
- `licenses/` retains the applicable Apache-2.0, MIT, and BSD-3-Clause terms.

`source/upstream-sparkle/` retains the complete Sparkle source dependency
closure used to audit and port the two Protobuf bundles. Every path below uses
this immutable raw prefix:

```text
https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/
```

| Path below the immutable prefix | Size | SHA-256 |
| --- | ---: | --- |
| `add-pure-annotations.ts` | 1,013 bytes | `ea26a3fafae245af845aeca213235abe7f2756190cf01e1cd365cab5b7015361` |
| `buf.gen.yaml` | 170 bytes | `aae392b40d5f5733f015184df1929b19b64ed165c1cba7c18e875b31e2e44f4c` |
| `buf.yaml` | 62 bytes | `6df9257f48534e841a931fe7d2fabfeb6f2fd698d3728d9f9a0f26ef5a7237b5` |
| `build.ts` | 4,905 bytes | `2549c1cf76043aa39e124ac37d40df25c53762e8a4f1ac9923740d23b14ab488` |
| `package.json` | 769 bytes | `b98a8915af5a85c681e21cdb973a739083ebf25001e0c0df3d6ab459666f878e` |
| `src/core/application.ts` | 464 bytes | `ea98e5150077a12383f2ddfb6ce3545a293463b2ca2609e4feb74e62a8f9ad68` |
| `src/core/compose.ts` | 404 bytes | `c8d367fe16bacedf13c081912da0b59492d5ebd20ef5edf4d8e64850d5431c69` |
| `src/core/context.ts` | 9,765 bytes | `0ae34929739cd765a6dc1457e06330c6ba4aee51df6660e4cbb8212bfcb44086` |
| `src/core/layer.ts` | 326 bytes | `50cd4bc141a1cdf92f1b08134ecb8bea97a5555a95a9227fab35344543e1042a` |
| `src/core/logger.ts` | 1,338 bytes | `b13fdf7ac983a877ec7c643d5be1f471b3938fefb36ca78169bd82fa7097927c` |
| `src/core/middleware.ts` | 2,300 bytes | `3205ddbc208d1b1761361801e3ce566b3d1586537c46e59630bf9da559ba6184` |
| `src/core/process.ts` | 479 bytes | `4337f528697794b8aa969e36b78defe91f355ea4f17e340810a3a49529f337ff` |
| `src/core/router.ts` | 2,850 bytes | `6757c3be8271f13f9dad5a9a5e3282a2f086b57c60efc01f709ede1eed922584` |
| `src/script/bilibili/protobuf/deprecated-handler.ts` | 2,407 bytes | `77a22d40127a7fa299b271aaca1d5cf19ca109bc9bd0f86bd61e79879c3b8eb7` |
| `src/script/bilibili/protobuf/handler.ts` | 16,379 bytes | `16c505dce1d5b0e63b4840e6208375e55c1f476ba1ddd640135610a70dde1b7b` |
| `src/script/bilibili/protobuf/middleware.ts` | 1,244 bytes | `9e89e6b6969bcc5f0d8e6883ecf1c2a954242bf33622aff6b7c6e75c94df9a16` |
| `src/script/bilibili/protobuf/request/app.ts` | 399 bytes | `9ed5468308c4e682a3a5a867d66fe047ad7a59bf5df15dd94589f69d1caee70b` |
| `src/script/bilibili/protobuf/request/main.ts` | 41 bytes | `ac21441904ad3752a68d1cb1cfcea4a7806b1a4ea5edf49e8df03ee02d0f1a6b` |
| `src/script/bilibili/protobuf/request/router.ts` | 1,036 bytes | `87b8a3429e58a01212e33f44a0f7b8ef28140543cd8e5e4e0c4d72ed155c4c6d` |
| `src/script/bilibili/protobuf/response/app.ts` | 401 bytes | `ab4d0bd15b413ea862c34b8e28865362531c2b36a87517618368cdf7cb68a213` |
| `src/script/bilibili/protobuf/response/main.ts` | 41 bytes | `ac21441904ad3752a68d1cb1cfcea4a7806b1a4ea5edf49e8df03ee02d0f1a6b` |
| `src/script/bilibili/protobuf/response/router.ts` | 1,817 bytes | `82a00e7898759d55a7812d3c9ea1fc3137535b215e49d6eb603aab2ef601cea2` |
| `src/service/sponsor-block.service.ts` | 820 bytes | `d387a77620d5789337f3a533714887fb17ab7b75eddb56130aaae64cea8ced94` |
| `src/types/common.d.ts` | 891 bytes | `f4f017e8dcc1f06f499dd55999b23a51177d0ad3190f70ac1b87e53ccadfc54d` |
| `src/types/context.d.ts` | 1,398 bytes | `757afc322ec20f3e065629a52d9cb3974f45acb70af77c5bc0d73d405ab76186` |
| `src/types/global.d.ts` | 953 bytes | `2259faa98a0a1857f47daff6a04c4f2bdc3bbfeabea4a4f7b46480e20c494709` |
| `src/types/loon.d.ts` | 1,079 bytes | `ab1fe2b335e1cd2333f388db65390e2b9242066c129f15f3df525d19f2dfae08` |
| `src/types/quantumult-x.d.ts` | 1,473 bytes | `d51a2ef813690849cd5a3f096a78fe5340d943a48c85e0fd717d0909656dfc1c` |
| `src/types/surge.d.ts` | 2,414 bytes | `d45b1966269999767efa6cba4f28d80200e1cc14e28dc696715ff3e0a402a1ad` |
| `src/utils/assert.ts` | 132 bytes | `c294a6c23e208e8b6ecbfcc7aa4693d7e95a70c53119b41623d83a5b79d1fa9a` |
| `src/utils/bilibili.ts` | 1,420 bytes | `43f483e37555f7deade2f6721ef3329acd1dc6f8aa11ece1dae9cbac39c2fcc2` |
| `src/utils/binary.ts` | 371 bytes | `29201c8ee74534d71f26a04b9a822bdbffcb0274de2c0a40cf9fd085b35c25ec` |
| `src/utils/index.ts` | 2,746 bytes | `45bac1a7ebc7e8b86c7964f1c13dfa0c83b508f557460086d5fe09af6d1af901` |
| `tsconfig.json` | 583 bytes | `3f4b2deb2588884226e41d75ecfb79aef4c2292c85caa10c17fa907f97681f23` |

The schema inputs were fetched from the same Sparkle commit on `2026-07-22`:
`source/proto/SHA256SUMS` binds the local copies to the same digests and the
source verifier rejects missing, extra, or changed schema files.

| Immutable schema source | Size | SHA-256 |
| --- | ---: | --- |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/proto/bilibili/app/card/v1/card.proto` | 349 bytes | `36f0ba3b85a65c67d15c3ea50f6eb2219353dd5c41ae6ae59b42fb1fa5c0fcbb` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/proto/bilibili/app/dynamic/v2/dynamic.proto` | 552 bytes | `82e03f0a60302466628bc26cd7371f33fefc1ccc88dfbcc3169a20e37e0b7753` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/proto/bilibili/app/interface/v1/search.proto` | 217 bytes | `c80036b21029732b468e52b7b8cc42c621e22603d2fb0995c5654817e39d96ea` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/proto/bilibili/app/interface/v1/teenagers.proto` | 235 bytes | `83b85b1c1bd96fc29ee5ad7219bcee1f5202b69bb88b65855f7fa9535650d196` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/proto/bilibili/app/playerunite/pgcanymodel/pgcanymodel.proto` | 290 bytes | `4177103b5af303f423f528a381e2f2897219b7e99354717ef1f173ab332b6b7f` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/proto/bilibili/app/playerunite/v1/player.proto` | 527 bytes | `4fab0148d3d3ee4a15075af04ad11966c17b4fa60af61e686ebd4d62dcc2eacd` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/proto/bilibili/app/playurl/v1/playurl.proto` | 432 bytes | `016100ae935f10be786b60b61f9bb40af9dcd54b82938e58a81bbf250be74a53` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/proto/bilibili/app/show/popular/v1/popular.proto` | 177 bytes | `15e413c142be474e0ac2604fd5747665cdc74d9816937b3962ea054a8d855d1f` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/proto/bilibili/app/view/v1/view.proto` | 770 bytes | `a1d2d0cd256e38315bd5f077cbdb4f3cfe64e2c5dcf7c696413faffadca90aac` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/proto/bilibili/app/viewunite/v1/view.proto` | 1,499 bytes | `50b338f373423c5d263108c5bf05ae09227f6cfb913ceffde3b1c62e39427df6` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/proto/bilibili/community/service/dm/v1/dm.proto` | 994 bytes | `b95ba7c2fa93f1a8b123a62d5d7ce308d9a559e754d782fe4f1cbb485f8d44cf` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/proto/bilibili/main/community/reply/v1/reply.proto` | 643 bytes | `0ed3885c40a212798b0691617028b16eec56e66b82c499e1967618f9c6384880` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/proto/bilibili/pgc/gateway/player/v2/playurl.proto` | 1,217 bytes | `fe53fd828d9abe7ec3be756f02ab110d4532342979b7ad66fbcb37aa90456525` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/proto/bilibili/playershared/playershared.proto` | 935 bytes | `23cfb49342f77f402a2c2c209ba39e102a3fa85f1bbe8d2b13303d2b0109e23a` |
| `https://raw.githubusercontent.com/kokoryh/Sparkle/12e89d6d93d72d39eb283ef81d2b58eb204cdb58/proto/bilibili/polymer/app/search/v1/search.proto` | 162 bytes | `452ec59582c48f5f6346ad403c81c376a82ff13c960f276e18648e2c01466fea` |

## Embedded components and deterministic build

The generated Protobuf artifacts include Apache-2.0 `protobuf-ts` 2.11.1
runtime code. Its current published version tag resolves to commit
`3f14440c5e52dd8223ac1919ad7f44e31432c667`. The pinned license is
`https://raw.githubusercontent.com/timostamm/protobuf-ts/3f14440c5e52dd8223ac1919ad7f44e31432c667/LICENSE`
— 10,140 bytes — SHA-256
`5e3400b93bbb099e83e52bab885e7441750673c21f97988ca3f1240639b63283`.

The native bundle uses the current published `fflate` 0.8.3 for bounded gzip
decoding. Its annotated `v0.8.3` tag peels to commit
`dcb3714a6c25db3a2748641019c5277413d09714`. The pinned license is
`https://raw.githubusercontent.com/101arrowz/fflate/dcb3714a6c25db3a2748641019c5277413d09714/LICENSE`
— 1,069 bytes — SHA-256
`0a1df3a083d0c010560aa342e87959c8c1070e6fd54545741f083f22d0c8b551`.

| Embedded npm archive | Size | SHA-256 |
| --- | ---: | --- |
| `https://registry.npmjs.org/@protobuf-ts/runtime/-/runtime-2.11.1.tgz` | 54,285 bytes | `3bb18cb373565b5c95e466c1db76e4b1d8166b62276a15e3547c36f9e25b502b` |
| `https://registry.npmjs.org/fflate/-/fflate-0.8.3.tgz` | 173,034 bytes | `38c2cd824402407b43153c782274aec2ea83ea688e4aa0b743c5f2c305857d92` |

The preferred-source inventory is stored in
`source/vendor-src/SOURCE_MANIFEST.tsv`. Paths below `fflate/` map to:

```text
https://raw.githubusercontent.com/101arrowz/fflate/dcb3714a6c25db3a2748641019c5277413d09714/
```

Paths below `protobuf-ts/` map to:

```text
https://raw.githubusercontent.com/timostamm/protobuf-ts/3f14440c5e52dd8223ac1919ad7f44e31432c667/
```

The native build deliberately keeps its previously reviewed build-only
toolchain (`@bufbuild/buf` 1.55.1, `@protobuf-ts/plugin` 2.11.1, esbuild
0.25.6, and TypeScript 5.8.3) because those versions remain sufficient to
reproduce the generated output; they are not embedded runtime behavior.
All registry URLs and integrity values are fixed in `source/package-lock.json`.

Rebuild with:

```powershell
Set-Location bilibili-cleaner/source
npm ci
npm run generate
npm run build
npx tsc --noEmit
npm run verify:sources
```

The expected minified bundle is 108,550 bytes with SHA-256
`dd92209bcd63c261ba3f6dd65bfc547f07bfd4ab83937143dba1f63c7286c46c`.
The fixed esbuild 0.25.6 build enables deterministic minification while
retaining the SPDX banner and `legalComments: 'eof'`. A fixed footer wraps the
minified implementation in the sole stable `function transform(context)`
entry point without exposing another global capability. Source maps remain
disabled: the complete preferred TypeScript, generated schemas, vendor source,
lockfile, and exact build inputs are distributed beside the bundle, and the
runtime has no source-map consumer. The output contains no timestamp or
absolute source path. No toolchain or `node_modules` directory is installed on
the gateway.

## License and attribution

Sparkle's `package.json` identifies `kokoryh` as author, and the repository is
licensed under GNU GPL version 3. No “or later” grant is supplied, so this
extension uses the conservative SPDX identifier `GPL-3.0-only`.

The native JavaScript, native TypeScript, and schema-derived generated
TypeScript are distributed under `GPL-3.0-only`. The final combined
`protobuf.js` is mapped as `GPL-3.0-only AND BSD-3-Clause` because it retains
Google's 2008 BSD-licensed `goog-varint` implementation. The raw bundle embeds
that complete copyright, three conditions, and disclaimer in its deterministic
banner. The exact standalone text is retained as
`source/licenses/goog-varint-BSD-3-Clause.txt`.

The bundle also incorporates Apache-2.0 `protobuf-ts` runtime material and MIT
`fflate` material; their component notices and source inputs remain available
beside the GPL preferred source. The published `protobuf-ts` runtime package
declares `(Apache-2.0 AND BSD-3-Clause)` because it contains both Google's
`goog-varint.ts` and Daniel Wirtz's BSD-licensed `protobufjs-utf8.ts`.
`source/bundle-inputs.json` proves that `protobufjs-utf8.ts` is removed from
the final bundle by tree shaking, while `goog-varint.js` is retained.

KeleeOne mirrors several Sparkle files and was only a discovery catalog. Its
repository-level CC license cannot replace Sparkle's original GPL license, so
no KeleeOne CC claim applies to this directory.

## Port mapping

| Pinned Loon behavior | Native 5gpn mapping |
| --- | --- |
| Six MITM hosts | Six exact `traffic.captureHosts`; `www.bilibili.com` replaces the obsolete `live.bilibili.com` capture. |
| Five LPX reject rules | Four exact-domain rejects plus `AND(DOMAIN-SUFFIX chat.bilibili.com, OR(p2p, stun, tracker))` as one typed rule. |
| `DOMAIN,bsbsb.top,PROXY` | `requirements.egressGroup.required: true`; the operator must select an existing mihomo group and the script cannot name or change it. |
| Five plugin arguments | Five required typed settings with pinned names and defaults. |
| Request mocks | Synthetic JSON and gRPC responses, including Splash List, `patch/tab/v2`, `PlayPause`, and `ViewEndPage`. |
| `/pgc/page/channel` JQ | Response-side removal of `TIP` modules and reviewed Bilibili activity banners. |
| JSON and JQ response operations | Pinned account/tab JQ plus route-specific live feed, room, user, and tracker behavior in `clean-json.js`. |
| Protobuf request transformer | SponsorBlock DmSeg replay plus optional pre-cleaned View and MainList replay, with reviewed fallback from `grpc.biliapi.net` to `app.bilibili.com`. |
| Protobuf response transformer | All 14 current response handlers, including iPad RelatesFeed, video-mentions removal, QoE removal, and comment-keyword filtering. |
| Webpage transformer | Injects the pinned client-side tree traversal into `www.bilibili.com` activity pages without sandbox `DOMParser`. |
| Proxy-client globals | Replaced by `transform(context)`, typed settings, explicit binary bodies, console logging, and origin-scoped synchronous network calls. |

The five gRPC mocks preserve the pinned binary frames and return the pinned
`Grpc-Status: 0` response header. Protobuf handling preserves unknown fields
and existing gRPC trailers, accepts the pinned single-frame gzip convention,
and emits one uncompressed frame with a corrected length prefix. When the
request declares `x-bili-moss-engine-type: 1` and no trailers exist, the native
port adds the pinned gRPC status header. Gzip input is streamed in one-KiB
chunks and rejected once the decompressed Protobuf message exceeds eight MiB.

The DmSegMobile, View, and MainList request paths share one native action
because their hosts, scheme, method, script, body mode, timeout, and body limit
are identical. The anchored path alternation preserves the script's endpoint
dispatch while snapshotting the 108,550-byte bundle only once for request
handling.

## Network permission, egress, and data disclosure

The request transformer requires exactly:

```text
https://app.bilibili.com
https://bsbsb.top
https://grpc.biliapi.net
```

The first and third origins replay selected captured RPCs. The replay can
contain the complete captured request body and reviewed headers. It preserves
the protocol-required exact `TE: trailers` header and removes every other
hop-by-hop header. The `bsbsb.top` request sends the derived BV identifier,
content ID, and fixed `category=sponsor` query. Enabling requires one operator
confirmation naming every origin and warning that all data visible to the
script can be sent there.

The upstream LPX routes only `bsbsb.top` to `PROXY`, while the native manifest
cannot name a proxy group or attach one only to a single network origin. The
required operator binding therefore applies to this extension's complete
capture and network-origin selector set. The operator must review that broader
scope and select an appropriate existing group; a missing or removed binding
fails closed. The script cannot inspect, name, select, or change that group.

Every call returns through authenticated mihomo SOCKS5. The extension has no
ambient `fetch`, cookie jar, redirect following, DNS, socket, filesystem,
process, timer, or module-loader access. It declares no persistent storage.

## Deliberate architecture boundary and remaining differences

- Loon exposes a device-model environment value. Native scripts do not. The
  frequent-uploader iPad exception uses the `bili-hd` user-agent prefix.
- Loon performs its two SponsorBlock requests concurrently with a three-second
  timeout. The port issues them concurrently as well, through the runtime's
  asynchronous `network.requestAsync`. Older gateways expose only the
  synchronous `network.request`; the port detects this and falls back to
  issuing the pair in sequence, which costs both latencies but returns the same
  response. The per-request timeout stays the runtime's fixed five seconds
  rather than upstream's three, alongside its one-MiB, call-count, and
  concurrency limits. Failure preserves the original request.
- The `grpc.biliapi.net` to `app.bilibili.com` replay fallback stays sequential
  on both paths. It is a fallback chain rather than a set of mirrors, so the
  second host is only asked once the first has failed.
- Sponsor segment data from `bsbsb.top` is mutable. Network, status, parse, or
  schema failure preserves normal Bilibili behavior.
- Client Chronos URLs are revision-pinned, but their GPL archives are not
  redistributed because their repository lacks corresponding preferred source.
- The webpage port injects the same browser-side behavior without reproducing
  `DOMParser` whole-document serialization. It preserves the upstream
  `hostname.includes("bilibili")` test.
- Native request and response bodies remain bounded. Reviewed JSON, Protobuf,
  and remote-data decode failures return no patch. VM timeouts, invalid result
  objects, and runtime-contract violations still fail the matched flow closed.

## Updating from upstream

1. Select one new `kokoryh/Sparkle` commit intentionally and keep the Loon LPX
   as the orchestration authority.
2. Fetch the LPX, JQ programs, audited dist files, schemas, preferred-source
   closure, package metadata, and license from commit-pinned raw URLs.
3. Resolve every client-visible Chronos file to one immutable commit without
   redistributing an archive that lacks corresponding preferred source.
4. Check current published embedded component versions and retain their exact
   npm archives, preferred source, licenses, and source manifests.
5. Diff settings, matchers, rules, mocks, JSON/JQ behavior, Protobuf handlers,
   webpage behavior, outbound requests, and URLs independently.
6. Regenerate `source/generated/`, rebuild `protobuf.js`, review the dependency
   lock and bundle projection, and update fixtures, provenance, SPDX mappings,
   notices, and `metadata.version` together.
7. Keep actions inside capture hosts, declare every origin exactly, and require
   fresh review for network, egress, routing, and execution-order changes.

## Migration and rollback

Follow the shared [`MIGRATION.md`](../MIGRATION.md) playbook for every selected
Sparkle, Chronos, or embedded-component revision. Upstream selection remains a
manual review decision.

### Migration contract

| Surface | Contract |
| --- | --- |
| Identity | Keep `io.5gpn.bilibili-cleaner`; bump `metadata.version` for every immutable manifest or runtime-script change. |
| Current manifest | `version=2.1.0`; `persistentStorage=false`; `settings=5`; `captureHosts=6`; `actions=11`; `routingRules=5`; `networkOrigins=3`; `upstreamMappings=0`; `egressRequired=true`. |
| State class | Stateless. `persistentStorage` is false. |
| Settings | Preserve the five current keys and types when possible. A normal update retains only values that remain valid under the candidate definitions. |
| Reviewed capability baseline | Six capture hosts, five routing rules, eleven actions, three network origins, five settings, and a required egress binding. |
| Operator state | A normal same-ID update retains valid settings, egress binding, `capture_dns`, and execution position. Review all of them before enable. |
| Source boundary | A changed GPL bundle must ship with complete corresponding preferred source and deterministic build inputs in the same revision. |
| External artifacts | Chronos URLs may change only to reviewed immutable revisions; archives without corresponding preferred source remain referenced rather than redistributed. |
| License review gate | Before any candidate or rollback publication, independently reconcile the aggregate SPDX expression and standalone-install notices with every Apache, MIT, BSD, and GPL bundle input; do not carry the existing expression forward by assumption. |
| Rollback | Prefer a verified publisher-managed revert-forward candidate at the installed manifest URL. An operator can publish it only from an operator-controlled fork. No extension data conversion is required. |

### Repeatable migration

1. Complete the playbook record separately for the LPX orchestration, JQ and
   dist behavior, all schemas and preferred source, Chronos artifacts, embedded
   npm components, settings, mocks, routes, origins, and outbound disclosure.
2. Update every immutable pin and inventory together. Regenerate schemas,
   rebuild `protobuf.js`, and compare the generated files,
   `bundle-inputs.json`, dependency lock, vendored archives, and preferred
   source byte-for-byte. `npm run verify:sources` must refetch every pinned
   source and npm archive, compare it with the local copy, and reject inventory
   drift before the build is accepted.
3. Before publishing either a forward candidate or rollback, reconcile the
   bundle's aggregate SPDX expression and retained component notices with the
   actual inputs, even when the input set appears unchanged. A reproducible
   build does not by itself prove that Apache, MIT, BSD, and GPL boundaries are
   synchronized.
4. Preserve setting keys and types when behavior allows. If an option or
   validation rule changes, list the affected value and required operator
   action in the migration record.
5. Compare every capture host, routing rule, action, network origin, egress
   requirement, and execution-order effect. Any origin or disclosure change
   requires a fresh permission review.
6. Run the common gates and the complete source rebuild below. Apply the exact
   candidate digest while disabled, confirm the five settings and egress
   binding, then exercise every request, response, mock, webpage, and network
   failure branch before enable.

### Rollback

The publisher prepares a same-ID revert-forward candidate containing the complete baseline
manifest, runtime behavior, corresponding preferred source, lockfile, vendored
archives, license mapping, and notices under a new version. Rebuild it from
source with that version incremented above the failing candidate and run every
Bilibili and core gate before publication. Disable the
failing candidate, apply the exact rollback digest, confirm all retained
settings and the egress binding, and test remote replay and SponsorBlock failure
paths before enable. Emergency reinstall from an old immutable manifest is
data-safe because the extension is stateless, but it loses settings, egress,
`capture_dns`, execution position, and installed source identity.

## Verification

Run:

```powershell
node tests/bilibili-fixtures.mjs
if ($LASTEXITCODE -ne 0) { throw "Bilibili fixtures failed with exit code $LASTEXITCODE" }
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
npm run routing:check
if ($LASTEXITCODE -ne 0) { throw "routing check failed with exit code $LASTEXITCODE" }
npm run verify:upstreams
if ($LASTEXITCODE -ne 0) { throw "upstream verification failed with exit code $LASTEXITCODE" }

Push-Location bilibili-cleaner/source
try {
  npm ci
  if ($LASTEXITCODE -ne 0) { throw "Bilibili npm ci failed with exit code $LASTEXITCODE" }
  npm run generate
  if ($LASTEXITCODE -ne 0) { throw "Bilibili generation failed with exit code $LASTEXITCODE" }
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Bilibili build failed with exit code $LASTEXITCODE" }
  npx tsc --noEmit
  if ($LASTEXITCODE -ne 0) { throw "Bilibili type check failed with exit code $LASTEXITCODE" }
  npm run verify:sources
  if ($LASTEXITCODE -ne 0) { throw "Bilibili source verification failed with exit code $LASTEXITCODE" }
  git diff --exit-code -- ../protobuf.js generated bundle-inputs.json
  if ($LASTEXITCODE -ne 0) { throw 'Bilibili generated artifacts differ from the reviewed source' }
} finally {
  Pop-Location
}
```

Then confirm six capture hosts, five routing rules, eleven actions, five
settings, three exact network origins, required operator egress, no storage
permission, and no proxy-client compatibility global. Exercise all JSON/JQ
branches, five mocks, HTML injection, all 14 response handlers, three request
handlers, gzip framing, unknown-field preservation, gRPC status behavior,
SponsorBlock success/failure, request fallback, disabled settings, and
malformed bodies. Cover both network entry points: that `requestAsync` starts
the replay and the SponsorBlock lookup before either resolves, and that a
runtime offering only `request` still produces the same response sequentially.
