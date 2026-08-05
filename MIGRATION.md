# Extension migration playbook

This playbook makes an intentionally selected upstream change repeatable from
source review through operator rollout and rollback. It does not discover,
poll, or automatically select upstream revisions. A maintainer chooses one
candidate commit or release, reviews it, and records the decision.

Each extension README supplies the extension-specific migration contract and
focused verification commands. This document supplies the shared procedure.

## Control policy

| Control | Required value |
| --- | --- |
| Candidate selection | `manual-only` |
| Automatic discovery | `forbidden` |
| Installed update | `explicit-only` |
| Post-update state | `disabled` |

## Terms

- **Baseline** is the reviewed extension and upstream snapshot before a change.
- **Candidate** is one explicitly selected immutable upstream revision and the
  native extension built from it.
- **Port migration** is the source change that translates the candidate into
  the strict `5gpn.io/v1` contract.
- **Rollout** is the operator action that replaces an installed immutable
  snapshot.
- **Publisher-managed revert-forward rollback** is a new reviewed update at the
  installed source URL that restores the previous behavior while retaining the
  same extension identity. It is available only to that URL's publisher or an
  operator using an operator-controlled fork.

The current 5gpn update contract has these relevant guarantees:

- an update check refetches only the installed manifest URL;
- the candidate must keep the same `metadata.id`;
- replacement requires the installed extension to be disabled;
- a setting value is retained only when its key and type are unchanged and the
  value remains valid under the candidate definition;
- the egress binding, `capture_dns` choice, and execution-order position are
  retained;
- replacement is atomic and leaves the candidate disabled; and
- extension storage is keyed by `metadata.id` while the installed candidate
  continues to declare `persistentStorage: true`.

There is no general extension-state export, migration hook, or historical
snapshot rollback operation. State compatibility and rollback safety must
therefore be designed into a stateful extension before rollout.
The current runtime preserves a same-ID storage bucket across disable and an
update that retains `persistentStorage: true`; removing that permission or
uninstalling can cause a later asynchronous prune. That timing is not a backup
or rollback mechanism.

## Required migration record

Complete this table in the change review. Copy durable decisions, new
limitations, and state behavior into the extension README in the same change.
Use `None` rather than leaving a field blank.

| Surface | Baseline | Candidate | Decision and evidence |
| --- | --- | --- | --- |
| Extension repository revision | | | |
| 5gpn core verification revision | | | |
| `metadata.version` | | | |
| Upstream repository and revision | | | |
| Relevant upstream files and their pinned commits | | | |
| Fetch and review date | | | |
| Settings keys, types, options, and defaults | | | |
| Persistent-storage keys and schemas | | | |
| Capture hosts and actions | | | |
| Network permission and data disclosure | | | |
| Upstream mappings and routing rules | | | |
| Required egress and execution order | | | |
| Licenses, notices, and preferred source | | | |
| Deliberate exclusions and limitations | | | |
| Rollback candidate and state compatibility | | | |
| Focused fixtures and end-to-end evidence | | | |

The record must identify exact counts as well as added, removed, and changed
items. A list that says only "updated to latest" is not a migration record.

## Repeatable port migration

### 1. Establish the baseline

Start from a clean worktree and record the repository revision:

```powershell
$extensionsRoot = (Resolve-Path '.').Path
$worktreeStatus = @(git -C $extensionsRoot status --short)
if ($LASTEXITCODE -ne 0) { throw 'git status failed' }
$worktreeText = $worktreeStatus -join [Environment]::NewLine
if ($worktreeStatus.Count -ne 0) { throw "worktree is not clean:`n$worktreeText" }
git -C $extensionsRoot rev-parse HEAD
if ($LASTEXITCODE -ne 0) { throw 'git rev-parse failed' }
```

Record the installed version when the change will be rolled out to an existing
installation. Also record current setting keys, whether each required setting
is complete, the egress binding, `capture_dns`, and execution-order position.
Do not copy secret or sensitive setting values into an issue, log, or migration
record.

### 2. Select and bind one candidate

Choose one authoritative upstream commit or published component release. Do
not use a mutable branch URL as provenance. Fetch every behavior, schema,
license, notice, and build input required by the extension from immutable URLs
when upstream publishes them there. A generated bundle available only as an
official release asset may use that direct asset URL; record its tag object,
source commit, release mutability, and UTC review date.

The commit embedded in an immutable raw URL, or the documented official release
record for a release-only bundle, is the provenance binding. Record the URL and
review date; do not add a manually maintained byte size, SHA-256, or other
digest as a second pin. Marketplace resource digests and sizes are derived from
the bytes read during a catalog build and are verified by the installer. They
are generated transport-integrity fields, not upstream provenance records.

Confirm that the chosen commit is the intended authority. This confirmation is
manual and review-driven; it is not an instruction to add automatic upstream
discovery.

### 3. Classify the semantic diff

Complete every row in the migration record before modifying runtime behavior.
Review matchers, settings, storage, outbound requests, disclosed data, routing,
egress, order, licenses, generated code, and deliberate exclusions
independently. Treat a removed capability as a migration decision, not as an
implicit consequence of updating a bundle.

If declarative actions cannot represent a published upstream bundle faithfully,
`entry: proxy-compat` is a supported implementation choice. Use only the
core-provided compatibility surface: do not add a shim or extension-defined
client globals. Stop when the core contract cannot represent the behavior or
the license obligations cannot be satisfied, and document that exclusion
instead of introducing unreviewed branch or ad-hoc mutable runtime downloads.

### 4. Choose the state strategy

Every extension must select one strategy for each storage key or schema surface
changed by a release. A stateless extension selects the stateless strategy once:

1. **Stateless:** `persistentStorage: false`; no data conversion is needed.
2. **Schema-compatible:** existing keys and values remain readable by both the
   baseline and candidate.
3. **Additive lazy migration:** the candidate reads the old schema and writes a
   new versioned key or envelope without destroying the rollback-readable old
   value.
4. **Documented reset and relearn:** loss of cached, non-authoritative state is
   acceptable and explicitly tested; the candidate fails safely until the
   state is rebuilt.

Do not destructively repurpose an existing key when the baseline cannot parse
the new value. Do not remove `persistentStorage` or uninstall a stateful
extension as part of a routine migration. A permission removal, key deletion,
or irreversible conversion requires a separately reviewed release and a
documented rollback boundary.

### 5. Implement the candidate

Keep `metadata.id` unchanged. Bump `metadata.version` whenever immutable
manifest bytes, runtime source URLs, or reviewed release-asset selections
change. Update the extension README, provenance, immutable raw URLs or official
release records, fetch dates, port mapping, limitations, fixtures, license
texts, notices, `REUSE.toml`, generators, and every source binding in the same
change.

A declarative action carries no runtime code at all. A native script, if one
is ever added, must continue to expose only `transform(context)`. A
`proxy-compat` action instead runs the reviewed upstream bundle through the
core-provided Loon persona; it must not ship a compatibility runtime or extra
globals. Record its authoritative module, exact source URL, action mapping,
settings, permissions, disclosed data, license boundary, `bodyMode`, timeout,
and body limit, and fix those decisions in focused fixtures. Keep action hosts
within `captureHosts` and declare storage, the network permission, mappings,
routing, and egress only when the candidate needs them.

### 6. Verify the repository

Run the common gates from the repository root:

```powershell
npm ci
if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE" }
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
$marketplacePath = Join-Path $env:TEMP ("5gpn-extensions-migration-" + [guid]::NewGuid().ToString('N') + '.json')
$testRevision = '0000000000000000000000000000000000000000'
try {
  npm run marketplace:build -- --revision $testRevision --output $marketplacePath
  if ($LASTEXITCODE -ne 0) { throw "marketplace build failed with exit code $LASTEXITCODE" }
  npm run marketplace:build -- --revision $testRevision --check $marketplacePath
  if ($LASTEXITCODE -ne 0) { throw "marketplace check failed with exit code $LASTEXITCODE" }
} finally {
  [System.IO.File]::Delete($marketplacePath)
}
```

Run the extension-specific commands in its README. A runtime-facing change
also requires external parser-contract evidence. As of 2026-08-05,
`moooyo/5gpn` `main` and `beta` both resolve to
`3ef751662154cb1df597d0f1292d6843c22694cd`, and neither tree contains the
former `cmd/5gpn-dns` package or
`TestExternalMaintainedExtensionsAreInstallableFromURL` and
`TestExternalMaintainedMarketplaceMatchesCoreContract`. The last publicly
available source for that parser contract is the immutable commit
`dd8bc6014af5f6cbc308d2b02a34b13da3f7ccbc`.

Prepare a clean `moooyo/5gpn` checkout at that exact fallback commit, set
`$coreRoot` below to it, and run the compatibility gate. This is a real parser
regression test, but it is not validation of the current `main` or `beta`
runtime:

```powershell
$extensionsRoot = (Resolve-Path '.').Path
$coreRoot = (Resolve-Path '..\5gpn-parser-contract').Path
$fallbackCoreRevision = 'dd8bc6014af5f6cbc308d2b02a34b13da3f7ccbc'
$coreStatus = @(git -C $coreRoot status --short)
if ($LASTEXITCODE -ne 0) { throw 'cannot inspect the fallback parser worktree' }
$coreStatusText = $coreStatus -join [Environment]::NewLine
if ($coreStatus.Count -ne 0) { throw "fallback parser worktree is not clean:`n$coreStatusText" }
$coreRevision = git -C $coreRoot rev-parse HEAD
if ($LASTEXITCODE -ne 0) { throw 'cannot resolve the fallback parser revision' }
if ($coreRevision -ne $fallbackCoreRevision) { throw "fallback parser revision is $coreRevision, expected $fallbackCoreRevision" }
$marketplacePath = Join-Path $env:TEMP ("5gpn-extensions-core-contract-" + [guid]::NewGuid().ToString('N') + '.json')
$testRevision = '0000000000000000000000000000000000000000'
$previousExtensionsRoot = $env:FIVEGPN_EXTENSIONS_ROOT
$previousMarketplaceIndex = $env:FIVEGPN_MARKETPLACE_INDEX

try {
  npm run marketplace:build -- --revision $testRevision --output $marketplacePath
  if ($LASTEXITCODE -ne 0) { throw "marketplace build failed with exit code $LASTEXITCODE" }
  $env:FIVEGPN_EXTENSIONS_ROOT = $extensionsRoot
  $env:FIVEGPN_MARKETPLACE_INDEX = $marketplacePath
  Push-Location (Join-Path $coreRoot 'cmd\5gpn-dns')
  try {
    go test ./... -count=1 -run '^(TestExternalMaintainedExtensionsAreInstallableFromURL|TestExternalMaintainedMarketplaceMatchesCoreContract)$'
    if ($LASTEXITCODE -ne 0) { throw "fallback parser contract failed with exit code $LASTEXITCODE" }
  } finally {
    Pop-Location
  }
} finally {
  $env:FIVEGPN_EXTENSIONS_ROOT = $previousExtensionsRoot
  $env:FIVEGPN_MARKETPLACE_INDEX = $previousMarketplaceIndex
  [System.IO.File]::Delete($marketplacePath)
}
```

Record the fallback revision, command, and CI result in the migration record.
The repository CI must pin this exact commit rather than a mutable branch.
When the core project publishes a new canonical external gate for the parser
that will ship, replace the fallback, run the supported gate for every required
channel, and record those revisions. Never present the fallback as current
channel coverage or treat the repository-local Node.js gates as core-parser
validation.

The all-zero marketplace revision identifies an uncommitted local integration
test and is not provenance. Record the candidate's real repository revision
after commit, and require post-commit CI to regenerate the marketplace with
that real revision.

Review the final diff and confirm that generated artifacts are reproducible and
that unrelated worktree changes are untouched.

## Repeatable installed rollout

1. The source publisher publishes the reviewed candidate at the same manifest
   URL used by the installed extension. An operator can perform this step only
   for an operator-controlled fork. An install from a permanently immutable
   commit URL cannot use the normal update path.
2. Run an update check and compare the displayed candidate version, settings,
   capture hosts, actions, routing, and permissions with the completed
   migration record.
3. Disable the baseline extension. Do not uninstall it.
4. Apply only the candidate from the reviewed source revision. Confirm that the
   replacement remains disabled.
5. Confirm which setting values were retained. Re-enter any value whose key,
   type, option set, or validation changed. Recheck the egress binding,
   `capture_dns`, and execution-order position.
6. Review the complete permission and routing summary, then enable the
   candidate on an authorized test device.
7. Run the focused smoke tests from the extension README. Record the observed
   result and the rollback decision point before wider rollout.

## Repeatable rollback

Prepare rollback before enabling the candidate:

- retain the baseline extension-repository commit, manifest, scripts, source,
  and provenance;
- prepare and verify a revert-forward candidate on a separate review branch or
  commit without publishing it at the installed URL unless rollback is needed;
- confirm that the state strategy remains readable by the baseline; and
- define the smoke-test failure that triggers rollback.

The preferred rollback is publisher-managed revert-forward. A public-catalog
operator cannot publish it and must wait for the catalog publisher unless the
operator installed an operator-controlled fork:

1. Revert the behavior at the same installed manifest URL in a new reviewed
   repository change while keeping `metadata.id` stable and using a new
   incremented `metadata.version` higher than the failing candidate.
2. Run the complete migration and verification gates on that rollback
   candidate.
3. Disable the failing candidate, review the rollback candidate from its
   immutable source revision, and apply it through the normal update path.
4. Confirm retained settings and operator state, then enable only after the
   baseline-focused smoke tests pass.

For a stateless extension, uninstalling and reinstalling an old immutable
manifest may be an emergency fallback, but it loses installed settings, egress
binding, `capture_dns`, execution position, and source identity. Do not use that
fallback for a stateful extension unless state loss is an explicitly reviewed
and tested part of the migration.

A stateful extension installed from a public or permanently immutable URL has
no immediate operator-controlled rollback when a publisher-managed candidate is
unavailable. Disable it, do not uninstall it or remove storage permission, and
preserve the state bucket while waiting for a reviewed publisher rollback or
moving through a separately reviewed operator-controlled source transition.

## Completion criteria

A migration is complete only when all of the following are true:

- the migration record has no blank rows;
- every upstream source is bound to an immutable commit URL or a deliberately
  selected official release asset, and its license boundary is verified;
- behavior, capability, state, license, and rollback decisions are explicit;
- repository, focused, and reproducibility gates pass, and the pinned external
  parser-contract fallback passes with its current-channel limitation recorded;
- any newly published canonical parser gate replaces the fallback and passes
  for every required channel;
- fresh-instance imports and installed update applications of both the
  candidate and rollback candidate finish disabled; and
- the extension README accurately describes the resulting behavior and the
  next maintainer can repeat the process without relying on chat history.
