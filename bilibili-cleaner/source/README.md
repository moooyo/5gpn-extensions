# Bilibili Cleaner corresponding source

This directory is the preferred form for modifying the native Protobuf
transformer. It is derived from `kokoryh/Sparkle` commit
`70a4914d7189e0a1da4b5839ba5f60d0206edf11` and is licensed under
`GPL-3.0-only`.

The checked-in `proto/` files are the pinned schema inputs. The checked-in
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

Rebuild on a supported Node.js host:

```powershell
npm ci
npm run generate
npm run build
npm run verify:sources
```

`npm run build` is deterministic and contains no timestamp or absolute path.
It also writes `bundle-inputs.json`, the deterministic esbuild input projection
used to audit exactly which Apache/MIT/BSD component files reached the bundle.
The generated bundle embeds Apache-2.0 `protobuf-ts` runtime material and MIT
`fflate` material. Their exact published npm archives are retained in
`vendor/`, and their original license texts are retained in `licenses/`.

The build toolchain is not installed on a gateway. Release artifacts are built
and verified before publication.
