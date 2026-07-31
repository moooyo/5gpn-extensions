# Apple WLOC Location Override

License: [`MIT`](../LICENSES/MIT.txt)

This is a normal URL-installable `5gpn.io/v1` extension. It is not compiled
into either 5gpn daemon and is not installed or enabled automatically. It is
intended only for authorised device, application, and network testing.

Install the manifest with the Console's **Install from URL** action:

```text
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/apple-wloc/extension.yaml
```

This public raw URL is installable directly. For a private fork, use the Console's local-add/upload flow or an operator-controlled public HTTPS mirror; never embed repository credentials in an extension URL.

## What changed, and why

Earlier revisions ported one transformer out of
`FFF686868/proxypin-wloc-spoofer`, an MIT-licensed **ProxyPin** script. That is
a different interception tool, not a proxy-client module, so the port was a
translation rather than an adoption, and it carried only the response rewrite.

This revision runs `Yu9191/wloc`, which publishes proxy-client modules for Loon,
Surge, Quantumult X, Stash, and Shadowrocket, and covers more:

- an online point picker at `https://wloc-pages.pages.dev/` whose saved
  coordinates take precedence over the configured settings, delivered by a
  second request-phase script on `/wloc-settings/save`
- a configurable reported accuracy and log level
- GCJ-02 to WGS84 conversion for mainland Apple Maps

Two costs were accepted rather than discovered later:

1. **Upstream ships no `LICENSE` file.** The repository has none, so by default
   all rights are reserved. This extension does not redistribute the scripts:
   the gateway fetches them from the immutable URLs below, which is how their
   author publishes them for proxy clients to load. That is an implicit grant to
   fetch and run, not permission to vendor or relicense, and it is a weaker
   position than the MIT provenance the previous revision had.
2. **`failClosed` is gone.** That was a local safety behavior with no upstream
   equivalent: an unexpected protocol change now returns the original location
   response instead of blocking it.

A third cost recorded here through `2.0.x` -- that the typed `location` setting
and its coordinate picker were gone -- no longer applies. See "Settings and the
picker" below: `2.1.0` gets the map back without changing what the scripts
receive.

## Pinned upstream

Reviewed at commit
[`eec07a8dc8de6dbaee8eac1fb376e4d03020154a`](https://github.com/Yu9191/wloc/tree/eec07a8dc8de6dbaee8eac1fb376e4d03020154a)
on `2026-07-28`. The published module points its `script-path` values at the
mutable `main` branch; both entries below are re-pinned to that immutable
commit, so the bytes a gateway fetches are the reviewed revision's.

| Artifact | Immutable raw URL |
| --- | --- |
| Loon plugin (argument and script source) | `https://raw.githubusercontent.com/Yu9191/wloc/eec07a8dc8de6dbaee8eac1fb376e4d03020154a/modules/wloc.lpx` |
| WLOC response transformer | `https://raw.githubusercontent.com/Yu9191/wloc/eec07a8dc8de6dbaee8eac1fb376e4d03020154a/dist/wloc.js` |
| Settings-save request script | `https://raw.githubusercontent.com/Yu9191/wloc/eec07a8dc8de6dbaee8eac1fb376e4d03020154a/dist/wloc-settings.js` |

## License and attribution

Upstream publishes no license file. This repository distributes none of its
bytes: `extension.yaml` records the URLs and digests above and the gateway
fetches them. The manifest and this documentation are original works under MIT,
and retain Yu9191 attribution.

The previous revision's port derived from the MIT-licensed
`FFF686868/proxypin-wloc-spoofer` at commit
`edee9b955f673cc8c4a52eb0a9c687a2e25dde4a`. That code has been removed;
`THIRD_PARTY_NOTICES.md` retains the attribution for the revisions that shipped
it.

## Settings and the picker

The four settings follow the upstream `[Argument]` block: `longitude`,
`latitude`, and `accuracy` as numbers and the log level as a select. They
reach the scripts as the decoded object Loon supplies. Three things deviate
from that block deliberately, because following it exactly produced a setting
that did nothing:

- **The coordinates ship no default.** Upstream reads its own shipped
  coordinate as "unconfigured": with empty storage and `longitude`/`latitude`
  exactly `113.94114`/`22.544577` it nulls the pair, logs a passthrough notice,
  and returns the response unmodified. Carrying those defaults left two
  required settings looking complete on an extension that patched nothing. With
  no default the extension stays not-ready until an operator sets a point,
  which is the honest state.
- **They are typed `number`, not `text`.** A same-ID update retains a stored
  value only when the key and the type both match, so this type change is what
  drops the sentinel every `2.0.x` install already persisted as a *value*.
  Without it, dropping the default would have protected only fresh installs.
  `number` also carries the `min`/`max` bounds that the Console and the daemon
  both enforce, where a `text` coordinate accepts any non-empty string on both
  sides. The cost is narrow and worth naming: the bundles guard their arguments
  with `argument.longitude && …`, so a coordinate of exactly `0` is falsy and
  is dropped. Longitude `0` or latitude `0` therefore behaves as unset.
- **The log level is keyed `LogLevel`.** Upstream's block declares `logLevel`.
  The response transformer reads both spellings and lets the capital one win,
  but the settings-save script reads only `$argument.LogLevel` -- so under
  upstream's own key that second script never receives the configured level.
  `LogLevel` is the one spelling both scripts honour. The options and the
  `info` default remain upstream's.

### The map point picker

The Console renders a map point picker with city search, a draggable
OpenStreetMap marker, and an accuracy circle over the flat `longitude`,
`latitude`, and `accuracy` trio, and writes those three keys.

This is worth stating precisely, because it is not the framework's `location`
setting type. A `location` value reaches a script nested under its own setting
key, and these scripts read three separate flat keys, so declaring one here
would give the console a map while the bundle silently ran on its own defaults.
The picker binds the flat trio instead: the operator gets the map, and what the
scripts receive is unchanged. Renaming any of those three keys takes the picker
away silently, so the fixture pins the exact names.

A coordinate saved through upstream's own picker page at
`https://wloc-pages.pages.dev/` is stored in extension-scoped persistent
storage by the `save-wloc-settings` action and takes precedence over these
settings, which is why this revision declares `persistentStorage: true` where
the pre-`2.0.0` one declared none. That page remains available and is not
required: the Console map covers the same job without leaving the gateway.

## Algorithm and format boundary

The extension intercepts HTTPS responses from only `gs-loc.apple.com` and
`gs-loc-cn.apple.com` at `/clls/wloc`, hands the body to the pinned upstream
transformer as binary, and bounds it at 8 MiB and 30 seconds. Apple publishes
no schema or stability contract for that response; it is an observed binary
framing followed by protobuf wire-format messages.

What the transformer does inside those bounds is upstream's, and this
repository does not re-specify it. Earlier revisions could: they shipped a
local frame and protobuf parser, and the numbered steps that used to stand here
described that parser, down to a typed `location` setting that no longer
exists. Running the upstream bundle means the recorded digest is what binds the
behavior. No line-by-line audit of `dist/wloc.js` is claimed here.

Treat a changed Apple response as incompatible until captured authorised test
traffic validates a deliberate update. A protocol change does not fail loudly:
`failClosed` was a local safety behavior with no upstream equivalent, so an
unrecognized response is returned unchanged rather than blocked.

## Port mapping

| Upstream Loon entry | 5gpn action |
| --- | --- |
| `Apple WLOC` response script | `rewrite-wloc-response`, `entry: proxy-compat`, binary body, 30 s |
| `WLOC Settings` request script | `save-wloc-settings`, `entry: proxy-compat`, no body, 10 s |
| `[MITM] hostname` | The same two exact names as `traffic.captureHosts` |
| `[Argument]` block | The four settings above. Types and options are upstream's; the coordinate defaults and the `LogLevel` spelling deviate deliberately, and "Settings and the picker" records why |

The manifest declares no network permission, no upstream mapping, and no required
egress-group binding. The scripts reach no third party: the picker page is
opened by the operator in a browser and its coordinate arrives through the
capture path, not through an outbound request from the script.

## Canonical record

| Item | Canonical value |
| --- | --- |
| Manifest | `apple-wloc/extension.yaml` |
| Upstream fetch date | `2026-07-28` |

## Maintenance and updates

1. Review the upstream repository and its license before taking any change.
   Use the pinned commit as the baseline; do not silently track its branch
   head.
2. Re-pin both scripts to the new immutable commit and record their sizes and
   digests in the table above. Nothing is vendored, so a candidate is adopted
   by changing a URL and its recorded digest, not by porting code.
3. Re-read the upstream `[Argument]` block. A renamed key stops applying
   silently rather than failing. Two keys deviate from it on purpose -- the
   undefaulted coordinates and the `LogLevel` spelling -- so check whether
   upstream has fixed either before re-aligning them.
4. Update provenance here and in `THIRD_PARTY_NOTICES.md` if the source
   project or pinned commit changes, including the statement that upstream
   publishes no license file.
5. Refresh the canonical record after every manifest change, then review the
   diff and run the verification commands below.

## Migration and rollback

Follow the shared [`MIGRATION.md`](../MIGRATION.md) playbook for every selected
upstream revision. Upstream selection remains a manual review decision.

### Migration contract

| Surface | Contract |
| --- | --- |
| Identity | Keep `io.5gpn.apple-wloc`; bump `metadata.version` for every immutable manifest or script change. |
| Current manifest | `version=2.1.0`; `persistentStorage=true`; `settings=4`; `captureHosts=2`; `actions=2`; `routingRules=0`; `network=false`; `upstreamMappings=0`; `egressRequired=false`. |
| State class | Stateful. `persistentStorage` is true: the picker page's saved coordinate lives in extension-scoped storage. |
| Settings | Keep `longitude`, `latitude`, and `accuracy` as required numbers with their `min`/`max` bounds, and `LogLevel` as a required select. The three coordinate keys are also what the Console binds its map picker to, so renaming one removes the picker silently. `longitude` and `latitude` carry no default on purpose. Valid same-key, same-type values survive a normal update; changing a type deliberately does not. |
| Sensitive values | Record whether each coordinate setting is complete, but never copy its value into a migration record, issue, or log. The same applies to a coordinate saved through the picker. |
| Reviewed capability baseline | Two capture hosts, two proxy-compat actions (one response rewrite and one request settings-save), four settings, persistent storage, and no network permission, routing rules, upstream mappings, or required egress binding. |
| Current migration baseline | Version `2.0.0` replaced the `FFF686868/proxypin-wloc-spoofer` port with the `Yu9191/wloc` proxy-client modules, removing the typed `location` setting and the local `failClosed` behavior with the parser that backed them. Version `2.1.0` restored a Console map picker over the flat coordinate trio without changing what the scripts receive, retyped the coordinates to bounded `number`s so every existing install drops upstream's passthrough sentinel instead of carrying it forward, and re-keyed the log level to the `LogLevel` spelling both scripts actually read. |
| Operator state | A normal same-ID update retains valid settings, stored picker coordinates, `capture_dns`, and execution position. There is no egress binding. Record presence, not sensitive coordinates. |
| Rollback | Prefer a verified publisher-managed revert-forward candidate at the installed manifest URL. An operator can publish it only from an operator-controlled fork. Reverting to `2.0.x` changes the coordinate type back to `text`, so the numeric point set under `2.1.0` is dropped rather than retained and both coordinates fall back to upstream's `113.94114`/`22.544577` passthrough sentinel: the extension will report ready and patch nothing until a point is re-entered. It also restores the `logLevel` key, which the settings-save script does not read. Reverting below `2.0.0` reintroduces the `location`/`failClosed` settings contract, which is a different settings shape again. |

### Repeatable migration

1. Complete the playbook record for both upstream transformers, the Loon plugin
   that supplies the arguments, the absent upstream license, the four settings,
   two hosts, action matchers, and body limits.
2. Diff the `[Argument]` block, the `[MITM]` hostname list, both `script-path`
   entries, and the picker's save path independently. Do not vendor the
   upstream scripts or the picker page; both are fetched from immutable URLs.
3. Refresh all three upstream artifacts, their recorded sizes and digests,
   source attribution, `THIRD_PARTY_NOTICES.md`, `REUSE.toml`, validator pins,
   fixtures, and `metadata.version` together.
4. If a setting key or type changes, or a retained value no longer passes the
   candidate validation boundary, document that the operator must re-enter the
   value before enable. A new install or emergency reinstall always requires
   re-entering the coordinates.
5. Updating from `2.0.x` drops both coordinates on purpose. A retained value
   needs the key *and* the type to match, and the coordinates changed from
   `text` to `number`, so every existing install loses its stored point instead
   of carrying upstream's `113.94114`/`22.544577` passthrough sentinel forward
   and going on reporting ready while patching nothing. The extension lands
   not-ready; set a real point before re-enabling. The stored `logLevel` value
   is discarded the same way, by rename rather than by type, and `LogLevel`
   starts at upstream's `info` -- so an operator who had chosen `off` or `debug`
   loses that choice and has to re-select it, and it now also reaches the
   settings-save script, which under the old key never received it.
6. Apply the candidate while disabled, confirm the retained setting presence,
   review the exact two-host boundary, and test authorized WLOC traffic before
   enabling it more broadly. Use a disposable non-sensitive test location and
   redact coordinates from response excerpts, screenshots, and packet captures.

### Rollback

The publisher prepares a same-ID revert-forward candidate that restores the baseline
settings contract, host boundary, and action matchers with a
new incremented version higher than the failing candidate. Apply it while
disabled and confirm that all four settings remain
valid before re-testing authorized WLOC traffic. Emergency reinstall from an old
immutable manifest loses the coordinate saved through the picker along with the
configured settings, `capture_dns`, execution position, and source identity;
reconfigure them before enable.

## Verification

Run the focused native-extension checks after a documentation or implementation
update:

```powershell
node tests/apple-testflight-fixtures.mjs
if ($LASTEXITCODE -ne 0) { throw "Apple and TestFlight fixtures failed with exit code $LASTEXITCODE" }
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
```

The focused fixture checks the manifest boundary: both actions, the four
settings with their types, bounds, and the three places they deviate from
upstream's `[Argument]` block, the exact coordinate keys the Console map picker
binds, the pinned immutable commit, and the two accepted costs recorded above.
It cannot check what the scripts
do -- they are upstream's and are fetched at runtime -- so what binds which
bytes run is the immutable commit in each URL.

## Limitations

- This modifies only eligible network-location responses; it does not modify
  GPS hardware readings. A device can prefer a real location source.
- Apple can change endpoint behaviour, compression, framing, protobuf field
  layout, or server-side validation without notice. The extension does not fail
  closed when that happens: `failClosed` had no upstream equivalent, so an
  unrecognized response is returned unchanged and the device receives its real
  location rather than an error.
- Only the two declared hosts and the action's exact path are in scope. It
  does not intercept other Apple services or change general DNS policy.
- HTTPS interception requires an operator-installed and trusted interception
  certificate, global interception enabled, and device traffic that actually
  reaches the gateway. It cannot affect traffic that bypasses the gateway.
- All authorised devices using one enabled extension receive the same configured
  target. The extension has no per-device identity, GPS simulation, or account
  bypass capability.
- The Console map picker is an operator convenience over the three coordinate
  settings. It is not the framework's `location` setting type, and it changes
  nothing about what the pinned scripts receive.
