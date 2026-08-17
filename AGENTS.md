# Repository guidance

- Write all code, comments, manifests, and documentation in English, except
  `README.zh-CN.md`, which is the Simplified Chinese translation of the root
  README and must remain synchronized with `README.md`.
- Keep one independently installable `5gpn.io/v1` extension per top-level
  directory. `script.entry: proxy-compat` is a supported execution form for a
  reviewed upstream bundle. Extensions must use the core-provided sandbox and
  must not vendor, reimplement, or extend its compatibility runtime or globals.
- Every extension must include `extension.yaml`, all immutable local scripts,
  and `README.md`.
- Each README must bind every upstream file to an immutable commit raw URL when
  upstream publishes it there. A generated bundle that exists only as an
  official release asset may use that direct asset URL instead; record the tag
  object, source commit, release mutability, fetch date, behavioral port
  mapping, deliberate exclusions, limitations, update procedure, and
  verification steps. Byte-level pinning is deliberately gone: commit identity
  or the reviewed upstream release record is the provenance binding, while the
  marketplace derives transport-integrity fields during publication. Nothing
  re-downloads an artifact to compare it against a manually recorded digest.
- Keep action hosts inside the extension's declared capture hosts. Native
  interception covers plain HTTP and TLS/H1/H2 only; never document HTTP/3
  capture. Declare storage and the network permission only when the
  implementation needs them. `requirements.egressGroup.required` is review
  metadata only: every installed extension has one explicit operator egress
  binding, a new import starts at `DIRECT`, and neither the manifest nor script
  can name or change it. `permissions.network` is one boolean and names no host:
  taking it means the extension may reach anywhere and may rewrite a captured
  request there. A cross-origin rewrite forwards the complete method, decoded
  body, and end-to-end headers, potentially including `Cookie` or
  `Authorization`; a same-origin rewrite inside the capture-host boundary needs
  no grant. Every review states the unbounded grant exactly.
- Document `traffic.upstreamMappings` with the engine's current split: an
  address or alias changes the intercepted upstream while preserving Host and
  SNI, while a `server:` target selects parser-validated resolver upstreams and
  is never dialed as the origin. Neither form selects egress.
- Prefer a declarative action -- `reject`, `mock`, or `jq` -- over a script.
  This repository ships no local JavaScript. A native script, if one is ever
  added, exposes only `transform(context)`, receives bounded action-scoped
  timers, and receives no ambient `fetch`, filesystem, process, raw-socket, or
  module-loader API. When declarative behavior
  cannot faithfully replace a published proxy-client bundle, `proxy-compat`
  may run that reviewed bundle with the core's documented Loon persona. Pin its
  source, document every matcher, setting, permission, disclosure, exclusion,
  and license boundary, and test its exact action wiring and resource limits.
  Do not add extension-defined Loon, Surge, Quantumult X, or other compatibility
  globals.
- Treat every upstream license as a hard boundary. An original file-level
  GPL, Apache, or MIT license overrides a different repository-level license
  asserted by a mirror. Keep the explicit per-extension mapping in
  `REUSE.toml`, license texts, notices, and README provenance synchronized.
- Do not distribute modified generated GPL artifacts without the complete
  corresponding preferred source and build inputs required by the GPL.
- Do not crawl or mirror extension stores. Update one reviewed upstream source
  at a time from immutable commit URLs or a deliberately selected official
  release asset.
- Run `npm test` before delivery. It is the gate CI runs first.
  When changing runtime-facing behavior, also run the installer-pinned mihomo
  full-review corpus documented in `MIGRATION.md`. Keep the source commit exact
  and synchronized with the installer; a branch, movable tag, parser-only
  fallback, or stub script is not runtime validation.
