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
| Post-update state | `preserve-existing-authorization` |

## Terms

- **Baseline** is the reviewed extension and upstream snapshot before a change.
- **Candidate** is one explicitly selected immutable upstream revision and the
  native extension built from it.
- **Port migration** is the source change that translates the candidate into
  the strict `5gpn.io/v1` contract.
- **Rollout** is the operator action that replaces an installed immutable
  snapshot.
- **Publisher-managed revert-forward rollback** is a new reviewed Marketplace
  entry that restores the previous behavior with a higher version while
  retaining the same extension identity.

The current 5gpn update contract has these relevant guarantees:

- pasted-URL and local review are install-only and refuse an installed ID;
- an installed extension changes version only after the operator selects and
  reviews a Marketplace entry;
- the candidate must keep the same `metadata.id`;
- review identifies the exact commit-addressed manifest URL and complete
  immutable snapshot digest, and apply refetches both;
- a selected entry, manifest URL, manifest digest, or snapshot change requires
  a new review;
- a setting value is retained only when its key and type are unchanged and the
  value remains valid under the candidate definition;
- the egress binding, `capture_dns` choice, and execution-order position are
  retained;
- replacement is atomic, needs no disable-first step, and preserves the prior
  enabled authorization; and
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
digest as a second pin. The Marketplace publishes the locally derived manifest
digest and a commit-addressed manifest URL. External script resources remain
live snapshot dependencies and are covered by the runtime's review digest, not
by a duplicate catalog resource list.

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

Run the extension-specific commands in its README. A runtime-facing change also
requires a complete review with the exact mihomo source operators receive. The
current installer pins `v1.19.28-monolith.29`, whose source commit is
`5798f177fbe0ef209d50e39204c16b21e53194ee`. Prepare a clean
`moooyo/mihomo` checkout at that commit on the isolated test environment and run
the full corpus gate:

```powershell
$extensionsRoot = (Resolve-Path '.').Path
$mihomoRoot = (Resolve-Path '..\mihomo-installer-pin').Path
$mihomoSourceCommit = '5798f177fbe0ef209d50e39204c16b21e53194ee'
$mihomoStatus = @(git -C $mihomoRoot status --short)
if ($LASTEXITCODE -ne 0) { throw 'cannot inspect the pinned mihomo worktree' }
$mihomoStatusText = $mihomoStatus -join [Environment]::NewLine
if ($mihomoStatus.Count -ne 0) { throw "pinned mihomo worktree is not clean:`n$mihomoStatusText" }
$actualCommit = git -C $mihomoRoot rev-parse HEAD
if ($LASTEXITCODE -ne 0) { throw 'cannot resolve the pinned mihomo revision' }
if ($actualCommit -ne $mihomoSourceCommit) { throw "mihomo revision is $actualCommit, expected $mihomoSourceCommit" }
$marketplacePath = Join-Path $env:TEMP ("5gpn-extensions-full-review-" + [guid]::NewGuid().ToString('N') + '.json')
$testRevision = '0000000000000000000000000000000000000000'
$previousExtensionsRoot = $env:FIVEGPN_EXTENSIONS_ROOT
$previousMarketplaceIndex = $env:FIVEGPN_MARKETPLACE_INDEX
$externalTest = Join-Path $extensionsRoot 'tests\mihomo-external-review_test.go'
$installedTest = Join-Path $mihomoRoot '5gpn\engine\external_extensions_corpus_test.go'
if (Test-Path -LiteralPath $installedTest) { throw "temporary test path already exists: $installedTest" }

try {
  npm run marketplace:build -- --revision $testRevision --output $marketplacePath
  if ($LASTEXITCODE -ne 0) { throw "marketplace build failed with exit code $LASTEXITCODE" }
  $env:FIVEGPN_EXTENSIONS_ROOT = $extensionsRoot
  $env:FIVEGPN_MARKETPLACE_INDEX = $marketplacePath
  Copy-Item -LiteralPath $externalTest -Destination $installedTest -Force
  Push-Location $mihomoRoot
  try {
    go test ./5gpn/engine -count=1 -run '^TestExternalOfficialMarketplaceFullReviewCorpus$'
    if ($LASTEXITCODE -ne 0) { throw "mihomo full-review corpus failed with exit code $LASTEXITCODE" }
  } finally {
    Pop-Location
  }
} finally {
  Remove-Item -LiteralPath $installedTest -Force -ErrorAction SilentlyContinue
  $env:FIVEGPN_EXTENSIONS_ROOT = $previousExtensionsRoot
  $env:FIVEGPN_MARKETPLACE_INDEX = $previousMarketplaceIndex
  [System.IO.File]::Delete($marketplacePath)
}
```

The test locally serves repository-owned commit URLs from the candidate checkout
and then uses the monolith's real Marketplace review, immutable snapshot,
complete configuration validation, goja compilation, and gojq compilation.
Absolute third-party script URLs are fetched for real. This is intentionally a
non-hermetic network integration gate: a missing or changed live dependency
must block publication instead of being replaced by a stub.

Record the exact mihomo source commit, command, and CI result in the migration
record. When the installer advances its mihomo artifact, update this pin and the
workflow together. Never use a branch or movable tag, and never present the
repository-local Node.js gates alone as runtime validation.

The all-zero marketplace revision identifies an uncommitted local integration
test and is not provenance. Record the candidate's real repository revision
after commit, and require post-commit CI to regenerate the marketplace with
that real revision.

Review the final diff and confirm that generated artifacts are reproducible and
that unrelated worktree changes are untouched.

## Repeatable installed rollout

1. Publish the reviewed candidate and regenerate the Marketplace from its exact
   repository commit. The entry's manifest, documentation, and license URLs
   must name that commit rather than `main`.
2. Select that Marketplace entry and compare the displayed candidate version,
   settings, capture hosts, actions, routing, permissions, reviewed manifest
   URL, and snapshot digest with the completed migration record.
3. Apply only the reviewed entry and digest. A review conflict means the source
   changed and requires a complete new review; never retry with the old digest.
   No disable-first step is required: confirm an enabled baseline remains
   enabled and a disabled baseline remains disabled.
4. Confirm which setting values were retained. Re-enter any value whose key,
   type, option set, or validation changed. Recheck the egress binding,
   `capture_dns`, and execution-order position.
5. Review the complete permission and routing summary, then test the candidate
   only on an authorized device.
6. Run the focused smoke tests from the extension README. Record the observed
   result and the rollback decision point before wider rollout.

## Repeatable rollback

Prepare rollback before enabling the candidate:

- retain the baseline extension-repository commit, manifest, scripts, source,
  and provenance;
- prepare and verify a revert-forward candidate on a separate review branch or
  commit without adding it to the Marketplace unless rollback is needed;
- confirm that the state strategy remains readable by the baseline; and
- define the smoke-test failure that triggers rollback.

The preferred rollback is publisher-managed revert-forward. A public-catalog
operator cannot publish it and must wait for the catalog publisher unless the
operator installed an operator-controlled fork:

1. Revert the behavior in a new reviewed repository change while keeping
   `metadata.id` stable and using a `metadata.version` higher than the failing
   candidate.
2. Run the complete migration and verification gates on that rollback
   candidate.
3. Select the rollback Marketplace entry, review its commit-addressed manifest
   and snapshot digest, and apply it through the normal review/apply path. The
   replacement preserves the authorization in force immediately before apply.
4. Confirm retained settings and operator state, then proceed only after the
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
- repository, focused, and reproducibility gates pass, and the installer-pinned
  mihomo full-review corpus passes with its exact source commit recorded;
- fresh installs finish disabled, while installed candidate and rollback
  applications preserve the prior enabled authorization; and
- the extension README accurately describes the resulting behavior and the
  next maintainer can repeat the process without relying on chat history.
