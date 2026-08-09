# CLAUDE.md

Follow [`AGENTS.md`](AGENTS.md) for repository rules.

## Debugging an extension that looks inert

If an extension is enabled and its rules are present, but nothing is actually
blocked, check whether the target app resolved around the interception with
HTTPDNS before concluding the rules are wrong.

5gpn steers at the DNS layer: a capture host reaches mihomo's in-process
interceptor only because the monolith's DoT resolver returned the gateway
address. An app carrying an HTTPDNS SDK asks its vendor's resolver over HTTPS
instead, gets the real address, and connects directly — capture and every
extension routing rule are skipped, and the gateway logs nothing at all.
Silence in the mihomo and plugin logs is the symptom, and it reads exactly like
"the app made no request".

Confirm the DNS verdict and capture owner through the authenticated Console,
then check the dedicated plugin log for the matching action lifecycle.

If the vendor's HTTPDNS endpoint shows traffic but the target host never does,
the app is bypassing.

Note the cost before blocking one: blocking an HTTPDNS endpoint does not fail
fast. The app spends its own timeout on the rejected call before falling back
to the system resolver, which lands ahead of any request the page needs. A
measured JD case cost 0.9–2.3 s of dead time per cold start.

Blocking is also cheaper at the DNS boundary. An operator DNS `block` rule
answers in one round trip, whereas a capture host costs DNS plus a TCP connect
plus a TLS ClientHello before an extension reject lands. Capture ownership is a
pre-policy overlay, so declaring a capture host the operator already blocks
makes the same block slower, not stronger.
