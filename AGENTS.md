# Repository guidance

- Write all code, comments, manifests, and documentation in English, except
  `README.zh-CN.md`, which is the Simplified Chinese translation of the root
  README and must remain synchronized with `README.md`.
- Keep one independently installable `5gpn.io/v1` extension per top-level
  directory. Do not add proxy-client compatibility runtimes or globals.
- Every extension must include `extension.yaml`, all immutable local scripts,
  and `README.md`.
- Each README must pin every upstream file to an immutable commit and record
  its raw URL, fetch date, behavioral port mapping, deliberate exclusions,
  limitations, update procedure, and verification steps. Byte-level pinning is
  deliberately gone: an immutable commit in the URL is what binds the bytes, and
  nothing re-downloads an artifact to compare it against a recorded digest.
- Keep action hosts inside the extension's declared capture hosts. Declare
  storage, the network permission, and required operator egress explicitly and
  only when the implementation needs them. `permissions.network` is one boolean
  and names no host: taking it means the extension may reach anywhere and may
  rewrite a captured request there, and every review says exactly that.
- Prefer a declarative action -- `reject`, `mock`, or `jq` -- over a script;
  no extension here ships JavaScript. A native script, if one is ever added,
  exposes only `transform(context)`. Do not add ambient `fetch`,
  filesystem, process, timer, module-loader, Loon, Surge, Quantumult X, or
  other compatibility APIs.
- Treat every upstream license as a hard boundary. An original file-level
  GPL, Apache, or MIT license overrides a different repository-level license
  asserted by a mirror. Keep the explicit per-extension mapping in
  `REUSE.toml`, license texts, notices, and README provenance synchronized.
- Do not distribute modified generated GPL artifacts without the complete
  corresponding preferred source and build inputs required by the GPL.
- Do not crawl or mirror extension stores. Update one reviewed upstream source
  at a time from immutable URLs.
- Run `npm test` before delivery. It is the gate CI runs first.
  When changing runtime-facing behavior, also validate the manifests with the
  current 5gpn core parser integration gate.
