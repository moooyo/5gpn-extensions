# Apple WLOC Location Override

License: [`MIT`](../LICENSES/MIT.txt) for the local manifest and documentation
only. The remote scripts retain upstream's AGPL-3.0 text and separate README
restriction described below.

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
  coordinates, accuracy, and random radius take precedence over the configured
  settings, delivered by a second request-phase script on
  `/wloc-settings/save`
- configurable reported accuracy, random-radius jitter, and log level
- GCJ-02 to WGS84 conversion for mainland Apple Maps

Two costs were accepted rather than discovered later:

1. **The remote scripts have a separate, restrictive license boundary.** The
   selected upstream commit publishes the standard AGPL-3.0 text, while its
   README additionally says that commercial-product and application-store use
   requires separate authorization. The operator selected this `4.0.0`
   candidate for non-commercial use. The local manifest and documentation stay
   MIT; this repository does not vendor or relicense the remote scripts.
2. **`failClosed` is gone.** That was a local safety behavior with no upstream
   equivalent: an unexpected protocol change now returns the original location
   response instead of blocking it.

A third cost recorded here through `2.0.x` -- that the typed `location` setting
and its coordinate picker were gone -- no longer applies. See "Settings and the
picker" below: `2.1.0` restored the map without changing what the scripts
receive, and `3.0.0` added the reviewed, default-off random-radius control.

Revision `4.0.0` tracks upstream's own domain expansion. Upstream widened its
response matcher and `[MITM]` hostname list from the two `gs-loc` names to the
five WLOC endpoints it has observed, and rebuilt the settings-save script with
comma-decimal parsing and explicit coordinate range validation. The response
transformer's bytes are unchanged. The accepted cost is that the reviewed
interception boundary grows from two hosts to five, including two non-Apple
AutoNavi names, so the version is a major bump even though upstream's own
release notes describe the change as additive.

## Pinned upstream

Reviewed at commit
[`ea204aedfd36b3d407c3506ac25db506a6c1b419`](https://github.com/Yu9191/wloc/tree/ea204aedfd36b3d407c3506ac25db506a6c1b419)
on `2026-08-20`. The published module points its `script-path` values at the
mutable `main` branch; all three entries below are re-pinned to that immutable
commit, so the bytes a gateway fetches are the reviewed revision's.
That commit was the `main` branch head during this review. It is three commits
ahead of the previous pin `782e9c5cadf215263d9d168314113e47baaa302c` and ahead
of the newest upstream release, `v1.1.0`, which still points at
`ecd4992a7c92b7d6e92eb80b948eba54202ab85a`. Upstream published no release for
these commits, so this candidate is a reviewed branch-head commit rather than a
tagged release; the raw URLs are commit-addressed either way.

The three upstream commits since the previous pin are:

| Commit | Subject | Effect on this port |
| --- | --- | --- |
| `de16c0183ee6b46bbb9c50e17aa98a117cefad4a` | comma-decimal tolerance and coordinate range validation (`#96`) | Rebuilds `dist/wloc-settings.js`. |
| `f219f957e1345a5ff5ec4223bfa715e154c7e14d` | widen the WLOC domain match (`#90`) | Adds three hosts to the response matcher and the `[MITM]` list. |
| `ea204aedfd36b3d407c3506ac25db506a6c1b419` | contributor credits | Documentation only; it shifts the license anchor line numbers used below. |

`dist/wloc.js` is byte-identical across all three commits and still matches the
`v1.1.0` blob. Its raw URL is re-pinned only to keep one commit per extension;
no response-transformer behavior changed. `dist/wloc-settings.js` and
`modules/wloc.lpx` did change, and both are re-reviewed below.

| Artifact | Immutable raw URL |
| --- | --- |
| Loon plugin (argument and script source) | `https://raw.githubusercontent.com/Yu9191/wloc/ea204aedfd36b3d407c3506ac25db506a6c1b419/modules/wloc.lpx` |
| WLOC response transformer | `https://raw.githubusercontent.com/Yu9191/wloc/ea204aedfd36b3d407c3506ac25db506a6c1b419/dist/wloc.js` |
| Settings-save request script | `https://raw.githubusercontent.com/Yu9191/wloc/ea204aedfd36b3d407c3506ac25db506a6c1b419/dist/wloc-settings.js` |

### What the reviewed diff changes

The `[Argument]` block is unchanged, so the five settings still map one-to-one.
Two things did change:

- **The response matcher and `[MITM]` list widened from two hosts to five.**
  Upstream's response line now matches
  `gs-loc.apple.com`, `gs-loc-cn.apple.com`, `gsp-ssl.ls.apple.com`,
  `bluedot.is.autonavi.com`, and `bluedot.is.autonavi.com.gds.alibabadns.com`
  at `/clls/wloc`. The last two are AutoNavi endpoints Apple uses inside
  mainland China, the second of them an Alibaba-DNS suffixed alias. The
  `WLOC Settings` request line was **not** widened and still matches only the
  two `gs-loc` names, so this port keeps that action on two hosts.
  `dist/wloc.js` contains no hostname of its own and gates on nothing, so the
  three added hosts reach exactly the same transformer.
- **The settings-save script now parses comma decimals and validates range.**
  The old build accepted a coordinate only when `parseFloat` produced a truthy
  value, so a comma-decimal locale string such as `22,54` parsed to `22` and an
  exact `0` was rejected as unset. The new build parses through
  `parseFloat(String(value || "0").replace(",", "."))` and rejects only when a
  coordinate is non-finite or exceeds +-90 latitude / +-180 longitude. The same
  comma-tolerant parse is applied to `randomRadius`; its "omit the field to keep
  the previous radius" merge behavior and its lack of an upper bound are both
  unchanged. `accuracy` still uses a plain `parseInt` and is not comma-tolerant.
  One side effect is not obvious from the commit message: the `|| "0"` default
  moved *inside* the parse helper, so a request with no `lon`/`lat` at all now
  parses to `0`, clears both checks, and is saved. "Settings and the picker"
  records what that means downstream.

## License and attribution

The selected upstream tree publishes the standard
[`AGPL-3.0`](https://github.com/Yu9191/wloc/blob/ea204aedfd36b3d407c3506ac25db506a6c1b419/LICENSE)
text. Its
[`README`](https://github.com/Yu9191/wloc/blob/ea204aedfd36b3d407c3506ac25db506a6c1b419/README.md#L296-L298)
also says that, without separate authorization, the code must not be used in a
commercial product or published in an application store. That statement is
more restrictive than the permissions normally associated with AGPL-3.0, so
this repository records both without interpreting the licensing ambiguity on
upstream's behalf. The operator explicitly selected non-commercial use for this
candidate.

This repository distributes none of those script bytes: `extension.yaml`
records immutable upstream URLs and the gateway fetches them from upstream.
The manifest and this documentation are original works under MIT, retain
Yu9191 attribution, and do not grant permission to vendor or relicense the
remote scripts.

The previous revision's port derived from the MIT-licensed
`FFF686868/proxypin-wloc-spoofer` at commit
`edee9b955f673cc8c4a52eb0a9c687a2e25dde4a`. That code has been removed;
`THIRD_PARTY_NOTICES.md` retains the attribution for the revisions that shipped
it.

## Settings and the picker

The five settings follow the upstream `[Argument]` block: `longitude`,
`latitude`, `accuracy`, and `randomRadius` as numbers and the log level as a
select. They reach the scripts as the decoded object Loon supplies. Four things
deviate from that block deliberately, because the raw `input` declarations do
not provide the validation or cross-bundle behavior this extension needs:

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
  sides. The cost is narrow and worth naming: the response transformer merges
  both its argument and its stored settings with `longitude && …` over a `null`
  default, so a coordinate of exactly `0` is falsy and is dropped. Longitude `0`
  or latitude `0` therefore still behaves as unset, from either source. That
  bundle is byte-identical at this pin, so the behavior is unchanged -- but the
  rebuilt settings-save script now *accepts* `0` and reports a successful save
  instead of returning an error, so the mismatch is quieter than it was. Treat
  an exact `0` on either axis as unsupported rather than as "passthrough off".
- **The log level is keyed `LogLevel`.** Upstream's block declares `logLevel`.
  The response transformer reads both spellings and lets the capital one win,
  but the settings-save script reads only `$argument.LogLevel` -- so under
  upstream's own key that second script never receives the configured level.
  `LogLevel` is the one spelling both scripts honour. The options and the
  `info` default remain upstream's.
- **The random radius is a bounded number.** It is required, defaults to `0`
  (disabled), and the manifest accepts `0..5000` metres, matching the upstream
  picker page. The response bundle checks only that the value is finite and
  greater than zero; it enforces no upper bound. A direct settings-save request
  can therefore persist a value above `5000`, outside the manifest boundary.

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

A coordinate, accuracy, and random radius saved through upstream's own picker
page at `https://wloc-pages.pages.dev/` are stored under the extension-scoped
`wloc_settings` key by the `save-wloc-settings` action and take precedence over
the manifest arguments. The current settings-save bundle reads the old object
and merges the new coordinate fields into it; when `randomRadius` is omitted,
the previous persisted radius is retained. That makes the radius sticky until
the picker writes another value, the stored object is cleared, or the extension
is reinstalled. It can also retain a value above the manifest's `5000` maximum,
because the upstream script itself has no upper bound.

At this pin that script parses coordinates through
`parseFloat(String(value || "0").replace(",", "."))`, so a comma-decimal string
such as `22,544865` is read as `22.544865` instead of being truncated to `22`,
and a save is rejected when a coordinate is non-finite or outside +-90 latitude
/ +-180 longitude. Values the previous truthiness guard accepted -- `lat=95`,
`lon=181` -- are now refused. The manifest boundary and the picker boundary
therefore agree on range, where before only the manifest enforced one.

Two consequences of that rewrite are worth stating plainly. The `|| "0"` default
moved inside the parse helper, so a save request that omits `lon`/`lat`
entirely now yields `0` rather than a falsy value: it passes both the finite and
the range check, reports success, and persists `0`/`0`. The error string it
would otherwise return still reads "missing lon/lat parameter", but a genuinely
missing parameter is no longer what triggers it -- only non-numeric or
out-of-range input is. Meanwhile the response transformer is byte-identical, so
it still merges the stored object with `longitude && ...` and drops a stored
`0`. A coordinate-less save therefore reports success and leaves the extension
in passthrough. Treat a successful save as confirmation that the request was
well-formed, not that a point was aimed.

This state is why the extension declares `persistentStorage: true` where the
pre-`2.0.0` revision declared none. The optional picker page is a mutable
external tool opened by the operator in a browser. It is not an immutable
upstream artifact, is not loaded by the extension runtime, and is not required:
the Console map covers coordinate selection without leaving the gateway. The
Console setting can configure `randomRadius`, but a previously persisted picker
value still wins until it is replaced or cleared.

## Algorithm and format boundary

The extension intercepts HTTPS responses at `/clls/wloc` from the five hosts
upstream's response matcher covers -- `gs-loc.apple.com`, `gs-loc-cn.apple.com`,
`gsp-ssl.ls.apple.com`, `bluedot.is.autonavi.com`, and
`bluedot.is.autonavi.com.gds.alibabadns.com` -- hands the body to the pinned
upstream transformer as binary, and bounds it at 8 MiB and 30 seconds. Apple
publishes no schema or stability contract for that response; it is an observed
binary framing followed by protobuf wire-format messages.

What the transformer does inside those bounds is upstream's, and this
repository does not re-specify it. Earlier revisions could: they shipped a
local frame and protobuf parser, and the numbered steps that used to stand here
described that parser, down to a typed `location` setting that no longer
exists. Running the upstream bundle means each immutable commit URL binds the
reviewed script revision. No line-by-line audit of `dist/wloc.js` is claimed
here.

At this pin, a positive finite `randomRadius` chooses a new point for each
response within the requested radius. Zero disables the behavior. The
transformer's bytes are unchanged from the previous pin; what moved upstream is
the matcher around it. `dist/wloc.js` carries no hostname string of its own and
reads `$request` once, so it gates on nothing: a body arriving from any of the
five declared hosts reaches exactly the same code path. Widening the matcher
therefore changes which responses are eligible, not how an eligible one is
transformed.

Treat a changed Apple response as incompatible until captured authorised test
traffic validates a deliberate update. A protocol change does not fail loudly:
`failClosed` was a local safety behavior with no upstream equivalent, so an
unrecognized response is returned unchanged rather than blocked.

## Port mapping

| Upstream Loon entry | 5gpn action |
| --- | --- |
| `Apple WLOC` response script | `rewrite-wloc-response`, `entry: proxy-compat`, binary body, 30 s |
| `WLOC Settings` request script | `save-wloc-settings`, `entry: proxy-compat`, no body, 10 s |
| `[MITM] hostname` | The same five exact names as `traffic.captureHosts`. `rewrite-wloc-response` matches all five; `save-wloc-settings` matches only the two `gs-loc` names, because upstream widened its response line and left its request line alone |
| `[Argument]` block | The five settings above. The coordinate defaults, number boundaries, and `LogLevel` spelling deviate deliberately, and "Settings and the picker" records why |

The manifest declares no network permission or upstream mapping and omits
`requirements.egressGroup`; normalization therefore reports
`egressRequired=false` as review metadata. Every installation still has one
explicit operator egress binding, initialized to `DIRECT`. The scripts reach no
third party: the picker page is opened by the operator in a browser and its
coordinate arrives through the capture path, not through an outbound request
from the script.

## Canonical record

| Item | Canonical value |
| --- | --- |
| Manifest | `apple-wloc/extension.yaml` |
| Upstream fetch date | `2026-08-20` |

## Maintenance and updates

1. Review the upstream repository and its license before taking any change.
   Use the pinned commit as the baseline; do not silently track its branch
   head.
2. Re-pin both scripts to the new immutable commit and record their exact raw
   URLs and fetch date above. Nothing is vendored, so a candidate is adopted by
   changing the immutable URLs, not by porting code.
3. Re-read the upstream `[Argument]` block. A renamed key stops applying
   silently rather than failing. The undefaulted coordinates, number bounds,
   and `LogLevel` spelling deviate on purpose, so check whether upstream has
   changed the behavior before re-aligning them.
4. Update provenance here and in `THIRD_PARTY_NOTICES.md` if the source
   project or pinned commit changes. Record both the exact upstream license
   text and any separate use restriction stated by its README; do not collapse
   one into the other.
5. Refresh the canonical record after every manifest change, then review the
   diff and run the verification commands below.

## Migration and rollback

Follow the shared [`MIGRATION.md`](../MIGRATION.md) playbook for every selected
upstream revision. Upstream selection remains a manual review decision.

### Migration contract

| Surface | Contract |
| --- | --- |
| Identity | Keep `io.5gpn.apple-wloc`; bump `metadata.version` for every immutable manifest or script change. |
| Current manifest | `version=4.0.0`; `persistentStorage=true`; `settings=5`; `captureHosts=5`; `actions=2`; `routingRules=0`; `network=false`; `upstreamMappings=0`; `egressRequired=false`. |
| Enablement | A fresh install starts disabled. An installed Marketplace replacement preserves the prior enabled authorization and does not require a disable-first step. |
| State class | Stateful. `persistentStorage` is true: the picker page's saved coordinate, accuracy, and random radius live in the extension-scoped `wloc_settings` object. |
| Settings | Keep `longitude`, `latitude`, `accuracy`, and `randomRadius` as required numbers with their `min`/`max` bounds, and `LogLevel` as a required select. The three coordinate keys are what the Console binds its map picker to, so renaming one removes the picker silently. `longitude` and `latitude` carry no default on purpose; `randomRadius` defaults to `0` and is bounded to `0..5000`. Valid same-key, same-type values survive a normal update; changing a type deliberately does not. |
| Sensitive values | Record whether each coordinate setting is complete, but never copy its value into a migration record, issue, or log. The same applies to a coordinate saved through the picker. |
| Reviewed capability baseline | Five capture hosts, two proxy-compat actions (one response rewrite across all five hosts and one request settings-save across the two `gs-loc` names), five settings, persistent storage, no network permission, routing rules, or upstream mappings, and normalized `egressRequired=false` review metadata because the manifest omits `requirements.egressGroup`. The runtime egress binding remains explicit. |
| License review gate | The manifest and documentation remain MIT. The remote scripts are selected under upstream's AGPL-3.0 text plus its README's separate commercial-product and application-store restriction; this candidate records an explicit non-commercial-use decision. |
| Current migration baseline | Version `2.0.0` replaced the `FFF686868/proxypin-wloc-spoofer` port with the `Yu9191/wloc` proxy-client modules, removing the typed `location` setting and the local `failClosed` behavior with the parser that backed them. Version `2.1.0` restored a Console map picker over the flat coordinate trio, retyped the coordinates to bounded `number`s, and re-keyed the log level to `LogLevel`. Version `3.0.0` moves to the licensed upstream HEAD, adds the default-off bounded `randomRadius` setting, adopts the settings-save merge behavior, and records that a persisted radius wins over the argument and may exceed the manifest maximum. Version `4.0.0` follows upstream's own expansion of the response matcher and `[MITM]` list from two hosts to five, and takes the rebuilt settings-save script with comma-decimal parsing and coordinate range validation. The response transformer's bytes are unchanged. |
| Operator state | A normal same-ID update retains valid settings, stored picker state, the explicit egress binding, `capture_dns`, and execution position. A fresh installation starts with `DIRECT`. Existing `2.1.0` storage has no radius, so the new argument starts at `0`; after the new settings-save script stores a radius, it remains authoritative until replaced or cleared. Updating from `3.0.0` changes no setting key, type, or value, and no stored picker state; what changes is the capture boundary, so the three added hosts begin to be intercepted as soon as the candidate is enabled. Record presence, not sensitive coordinates. |
| Rollback | Prefer a verified publisher-managed revert-forward Marketplace entry with a higher version. Reverting to the `3.0.0` behavior narrows the capture boundary back to the two `gs-loc` names, so the three added hosts stop being intercepted, and restores the older settings-save script, which truncates a comma-decimal coordinate at the comma and persists out-of-range values. Any coordinate already stored through the newer script stays stored and stays valid. Reverting to the `2.1.0` behavior removes the visible `randomRadius` setting and makes the old bundles ignore a stored radius, but it does not necessarily erase that value; a later `3.0.0`-compatible update can make it active again unless storage was cleared. Restoring the old upstream pin also restores its no-license-in-tree uncertainty and requires a new license review. Reverting to `2.0.x` additionally changes coordinate types back to `text` and restores the ineffective `logLevel` spelling. Reverting below `2.0.0` reintroduces the different `location`/`failClosed` contract. |

### Repeatable migration

1. Complete the playbook record for both upstream transformers, the Loon plugin
   that supplies the arguments, the exact upstream AGPL-3.0 text, its separate
   non-commercial/application-store statement, the five settings, five hosts,
   action matchers, and body limits.
2. Diff the `[Argument]` block, the `[MITM]` hostname list, both `script-path`
   entries, and the picker's save path independently. The response line and the
   request line carry their own host patterns and have already widened at
   different times, so read each one rather than inferring it from the `[MITM]`
   list. Do not vendor the upstream scripts. Treat the optional browser-opened
   picker page as a mutable external tool, not as an immutable runtime
   dependency.
3. Refresh the pinned commit, all three immutable raw artifact URLs, the fetch
   date, source attribution, `THIRD_PARTY_NOTICES.md`, validator pins, fixtures,
   and `metadata.version` together. Keep the local MIT `REUSE.toml` mapping;
   the AGPL-3.0 scripts remain remote upstream works.
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
6. Updating from `2.1.0` retains the four existing same-key settings and saved
   picker object. The new `randomRadius` setting starts at `0`, but after the
   new settings-save bundle persists a radius it overrides the manifest value.
   A save request that omits the field preserves the old radius, and the bundle
   itself accepts finite values above the manifest's `5000` maximum.
7. Confirm that the deployment is non-commercial and is not being published in
   an application store under the upstream README restriction recorded above.
   If that is not true, stop and obtain separate upstream authorization.
8. Apply the reviewed Marketplace candidate without a disable-first step,
   confirm the prior authorization and retained setting presence, review the
   exact five-host response boundary and the narrower two-host settings-save
   boundary, and test authorized WLOC traffic. Use a disposable non-sensitive test location and
   redact coordinates from response excerpts, screenshots, and packet captures.

### Rollback

The publisher prepares a same-ID revert-forward candidate that restores the baseline
settings contract, host boundary, and action matchers with a
new incremented version higher than the failing candidate. Review and apply its
Marketplace entry, confirm the prior authorization and that the retained
settings remain valid for the restored contract -- five for a `3.0.0` baseline,
the four pre-`3.0.0` ones for an older baseline -- and decide whether to clear
`wloc_settings`; an ignored
stored radius can become active again on a later upgrade. The old settings-save
bundle removes the field when it next overwrites the object, while the
deterministic option is to clear the object and then re-enter the coordinate
and accuracy. Then re-test authorized WLOC traffic. Emergency reinstall from
an old
immutable manifest loses the coordinate saved through the picker along with the
configured settings, `capture_dns`, execution position, and source identity;
reconfigure them before enable. Any candidate that restores the older upstream
pin must also reopen the license review because that immutable tree contains no
license file.

## Verification

Run the focused native-extension checks after a documentation or implementation
update:

```powershell
node tests/apple-testflight-fixtures.mjs
if ($LASTEXITCODE -ne 0) { throw "Apple and TestFlight fixtures failed with exit code $LASTEXITCODE" }
npm test
if ($LASTEXITCODE -ne 0) { throw "npm test failed with exit code $LASTEXITCODE" }
```

The focused fixture checks the manifest boundary: both actions, the five
settings with their types and bounds, the exact coordinate keys the Console map
picker binds, the pinned immutable commit, the AGPL-3.0/non-commercial license
record, and the accepted costs recorded above.
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
- Only the five declared hosts and the action's exact path are in scope, and
  the settings-save action covers only the two `gs-loc` names within that set.
  It does not intercept other Apple services or change general DNS policy. Two
  of the five hosts are AutoNavi endpoints rather than Apple ones; they are in
  scope because upstream's reviewed matcher covers them.
- HTTPS interception requires an operator-installed and trusted interception
  certificate, global interception enabled, and device traffic that actually
  reaches the gateway. It cannot affect traffic that bypasses the gateway.
- All authorised devices using one enabled extension share the same configured
  centre point, accuracy, and radius, although a positive radius can produce a
  different offset on each response. The extension has no per-device identity,
  GPS simulation, or account bypass capability.
- The Console map picker is an operator convenience over the three coordinate
  settings. It is not the framework's `location` setting type, and it changes
  nothing about what the pinned scripts receive.
- The manifest limits `randomRadius` to `5000` metres, but the upstream
  settings-save and response scripts do not enforce that maximum. A direct
  request can persist a larger finite value, and merged saves that omit the
  field retain it. The persisted value takes precedence until replaced or
  cleared.
- A settings-save request that omits both coordinates is accepted at this pin
  and persists `0`/`0`, which the byte-identical response transformer then
  treats as unset. The save reports success while the extension stays in
  passthrough. The same applies to an operator who deliberately aims at
  longitude `0` or latitude `0`.
- The selected upstream scripts are for the explicitly chosen non-commercial
  use recorded above. Commercial-product or application-store deployment needs
  separate upstream authorization under the upstream README statement.
