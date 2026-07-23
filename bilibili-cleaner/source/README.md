# Bilibili Cleaner corresponding source

This directory is the preferred form for modifying the native Protobuf
transformer. The native work is derived from `kokoryh/Sparkle` commit
`12e89d6d93d72d39eb283ef81d2b58eb204cdb58` under `GPL-3.0-only`; embedded
component source and notices retain their independent Apache-2.0, MIT, and
BSD-3-Clause boundaries as mapped in the repository `REUSE.toml`.

The checked-in `proto/` files are the pinned schema inputs and
`proto/SHA256SUMS` binds their exact local and upstream bytes. The checked-in
`generated/` files are the corresponding `protobuf-ts` 2.11.1 output, kept so
the distributed bundle can be rebuilt without first regenerating schemas.
`native-protobuf.ts` is the 5gpn adapter and preferred source for the behavior
in `../protobuf.js`.

`upstream-sparkle/` retains the complete pinned Sparkle source dependency
closure used to audit and port the two Protobuf bundles. `SHA256SUMS` records
every byte-for-byte source file. Each path resolves below the immutable raw
base documented in the extension README.

`vendor-src/` retains the preferred TypeScript and build inputs for the two
embedded npm components. `SOURCE_MANIFEST.tsv` records every file, byte size,
and digest. The component commit and raw URL bases are documented in the
extension README.

`npm run verify:sources` refetches every Sparkle, schema, vendor-source, and
embedded npm archive pin; compares its size and digest with the distributed
local copy; and rejects missing or extra inventory members. It also binds the
local package manifest and lockfile used by the deterministic build.

Rebuild on a supported Node.js host:

```powershell
npm ci
npm run generate
npm run build
npm run verify:sources
```

`npm run build` uses the pinned esbuild 0.25.6 with deterministic minification,
the repository SPDX banner, EOF legal comments, a fixed stable
`function transform(context)` footer, and no source map. A source map is not
required for modification because this complete preferred source, generated
schema output, lockfile, vendor source, and build program are distributed
together. The bundle contains no timestamp or absolute path. The build also
writes `bundle-inputs.json`, the deterministic esbuild input projection used to
audit exactly which Apache/MIT/BSD component files reached the bundle. The
generated bundle embeds Apache-2.0 `protobuf-ts` 2.11.1 runtime material, its
Google 2008 BSD-licensed `goog-varint` component, and MIT `fflate` 0.8.3
material. The complete Google notice is embedded in the raw bundle banner and
retained independently in `licenses/goog-varint-BSD-3-Clause.txt`. Exact npm
archives remain in `vendor/`, and component license texts remain in
`licenses/`.

The build toolchain is not installed on a gateway. Release artifacts are built
and verified before publication.
