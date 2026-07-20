# HTTPDNS Interceptor

License: [`CC-BY-NC-SA-4.0`](../LICENSES/CC-BY-NC-SA-4.0.txt)

This directory contains a normal 5gpn.io/v1 extension. It blocks the remaining
hostname-based HTTPDNS-related HTTP requests from the pinned upstream rule set.
It is not compiled into either 5gpn daemon and is not installed or enabled
automatically.

Install extension.yaml from the Console's Install from URL action:

~~~
https://raw.githubusercontent.com/moooyo/5gpn-extensions/main/httpdns-interceptor/extension.yaml
~~~

This public raw URL is installable directly. For a private fork, use the Console's local-add/upload flow or an operator-controlled public HTTPS mirror; never embed repository credentials in an extension URL.

The extension has no settings, persistent storage, network permission, upstream
mapping, or required egress-group binding. When enabled with the global
interception master, it captures exactly six hosts and aborts only the request
paths documented below. All other traffic keeps the normal mihomo egress path.

## Pinned upstream

| Field | Value |
| --- | --- |
| Upstream repository | mihoyo-typ/KeleeOne |
| Upstream display name | HTTPDNS Interceptor |
| Upstream file | Plugin/Block_HTTPDNS.lpx |
| Pinned commit | ab6c3182fb2b09bcc34456f496282ec0b8e9217b |
| Raw URL | https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/Plugin/Block_HTTPDNS.lpx |
| Raw file SHA-256 | 08429c4f1c677d79e87eb3cd41e880868f7a71381dc1d6c81b393734fd5df21a |
| Upstream-declared date | 2025-08-20 00:30:31 |
| Snapshot verified | 2026-07-20 |

The commit, raw URL, and digest are intentionally fixed. They make a later
review independent of mutable branches, tags, or the KeleeOne distribution
site.

## License and attribution

This native extension port is adapted material from KeleeOne's
Block_HTTPDNS.lpx at the pinned commit above. The original Loon rule format was
changed into a strict 5gpn.io/v1 manifest and a native transform(context)
request-abort script. DNS-policy-covered domain rules and unsupported
hard-coded-IP, IPv6, non-HTTP, and non-steered rules were intentionally omitted
from this extension, as documented below.

The upstream root license is
[CC BY-NC-SA 4.0](../KELEEONE-LICENSE.md). This adapted material is provided
under the same CC BY-NC-SA 4.0 terms: attribution is required, commercial use
is not permitted, and adaptations must be shared under the same license.

The source file's `#!author` metadata credits 可莉🅥 (`iKeLee`, linked to
<https://github.com/luestr/ProxyResource/blob/main/README.md>) and VirgilClyne
(<https://github.com/VirgilClyne>). Those supplied creator identifications are
retained here and in the repository notices.

The pinned upstream license is
`https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/LICENSE`.
It is 21,286 bytes with SHA-256
`047d2259741a3ebb30d8c8a43d4ba79b5b229a069acd1d2bea49f22b297d8e98`
and was verified on `2026-07-20`.

## Rule conversion

The original .lpx file is a Loon rule list. 5gpn does not parse or emulate that
format. This extension expresses the supported residual rules as a strict
native manifest and one transform(context) script. Every action is a request
action with bodyMode none; block.js returns { abort: true }, so a matched
request fails closed before it is sent upstream.

| Native action | Upstream rule | Native matcher |
| --- | --- | --- |
| block-huya-httpdns-launch | URL-REGEX for http cdn.wup.huya.com launch/queryHttpDns | http, cdn.wup.huya.com, ^/launch/queryHttpDns |
| block-huya-httpdns-monitor | https? cdn.wup.huya.com monitor/monitor.jsp reject | http or https, cdn.wup.huya.com, ^/monitor/monitor\.jsp |
| block-ximalaya-httpdns-login | URL-REGEX for http xmc.ximalaya.com xmlymain-login-web/login | http, xmc.ximalaya.com, ^/xmlymain-login-web/login/ |
| block-weibo-httpdns-config | the two URL-REGEX rules for api.weibo.cn [/2]/httpdns/config | http, api.weibo.cn, ^/(?:2/)?httpdns/config(?:\?.*)?$ |
| block-mail-httpdns-config | https? appconf.mail.163.com mailmaster/api/http/urlConfig.do reject-dict | http or https, appconf.mail.163.com, ^/mailmaster/api/http/urlConfig\.do$ |
| block-91160-httpdns-broker | https msglb.91160.com msg/outer/broker/get reject-dict | https, msglb.91160.com, ^/msg/outer/broker/get$ |
| block-ximalaya-httpdns-linkeye | https gslbali.ximalaya.com linkeye-cloud/httpdns reject | https, gslbali.ximalaya.com, ^/linkeye-cloud/httpdns/ |

The upstream reject-dict action has no native compatibility mode. It is
deliberately converted to the same fail-closed request abort as reject, avoiding
an invented response schema for an undocumented third-party client format.

## Not migrated and limitations

### Already covered by DNS policy

The following 58 unique upstream DOMAIN rules are already covered by the
operator-editable etc/block-dns-bypass.txt DNS policy seed. They remain DNS-only
blocks and are intentionally not duplicated as capture hosts:

~~~
aedns.weixin.qq.com
apidns-js.kwd.inkuai.com
apidns.kwd.inkuai.com
dns.iqiyi.com
dns.jd.com
dns.qiyipic.iqiyi.com
dns.weibo.cn
dns.weixin.qq.com
dns.weixin.qq.com.cn
dns2.q2cdn.com
doh.iqiyi.com
doh.ptqy.gitv.tv
dotserver.douyucdn.cn
hd.xiaojukeji.com
hdns.ksyun.com
httpdns-api.aliyuncs.com
httpdns-browser.platform.dbankcloud.cn
httpdns-sc.aliyuncs.com
httpdns-sdk.n.netease.com
httpdns-v6.gslb.yy.com
httpdns.alicdn.com
httpdns.baidu.com
httpdns.baidubce.com
httpdns.bcelive.com
httpdns.bilivideo.com
httpdns.browser.miui.com
httpdns.c.cdnhwc2.com
httpdns.calorietech.com
httpdns.cctv.com
httpdns.danuoyi.tbcache.com
httpdns.huaweicloud.com
httpdns.kg.qq.com
httpdns.kwd.inkuai.com
httpdns.meituan.com
httpdns.music.163.com
httpdns.n.netease.com
httpdns.n.shifen.com
httpdns.ocloud.heytapmobi.com
httpdns.ocloud.oppomobile.com
httpdns.platform.dbankcloud.cn
httpdns.platform.dbankcloud.com
httpdns.push.heytapmobi.com
httpdns.push.oppomobile.com
httpdns.yunxindns.com
httpdns.zybang.com
httpdns1.cc.cdnhwc5.com
httpdnsmultiapi.meituan.com
httpdnsmultiapivip.meituan.com
httpsdns.baidu.com
kuaishou.httpdns.pro
lofter.httpdns.c.163.com
music.httpdns.c.163.com
resolver.msg.xiaomi.net
serveraddr.service.kugou.com
tp2p.kg.qq.com
twns.p2ptun.qq.com
union-httpdns.gslb.yy.com
yyapp-httpdns.gslb.yy.com
~~~

The source's incomplete https? amdc.alipay.com/query rewrite line has no
terminal Loon action. It is not converted; amdc.alipay.com is already present
in the DNS bypass blocklist.

### Hard-coded IP rules

No source rule that targets an IP literal is migrated. A native extension can
acquire traffic only through a DNS hostname in traffic.captureHosts; it cannot
request an IP certificate, infer a host from an IP URL, or reliably recover
traffic that did not traverse DNS steering. This excludes every upstream
IP-CIDR, IP-CIDR6, IP-literal URL-REGEX, bare URL rule, Rewrite IP rule, and IP
entry in MitM.

Excluded IPv4 CIDR targets:

~~~
39.156.140.30/32, 39.156.140.47/32, 39.156.140.245/32
42.81.232.18/32, 42.187.182.106/32, 42.187.182.123/32, 42.187.184.154/32
43.130.30.237/32, 43.130.30.240/32, 43.137.153.151/32, 43.137.159.31/32
43.152.112.101/32, 43.153.248.120/32, 60.28.172.100/32, 61.151.231.157/32
101.32.104.104/32, 101.124.19.122/32, 106.39.206.21/32, 106.39.206.25/32
106.39.206.70/32, 111.31.201.194/32, 111.31.241.76/32, 111.31.241.140/32
111.206.147.156/32, 111.206.147.210/32, 111.206.148.27/32, 116.128.177.249/32
116.130.224.150/32, 116.130.224.205/32, 117.185.247.73/32, 118.89.204.198/23
119.29.29.98/32, 119.29.29.99/32, 123.151.48.171/32, 123.151.48.193/32
123.151.48.208/32, 123.151.54.50/32, 180.153.202.85/32, 183.192.196.31/32
186.76.76.200/32, 203.107.1.0/24, 203.205.129.102/32, 203.205.234.132/32
220.196.159.73/32, 103.224.222.208/32, 81.71.61.216/32, 59.111.239.61/32
59.111.239.62/32, 115.236.121.51/32, 115.236.121.195/32, 39.97.130.51/32
39.97.128.148/32
~~~

Excluded IPv6 CIDR targets:

~~~
240e:928:1400:10::25/128
2402:4e00:8030:1::17/128
2402:4e00:1900:1700:0:9554:1ad9:c3a/128
2408:8711:10:10::20/128
2409:8702:4860:10::4d/128
2402:db40:5100:1011::5/128
2402:4e00:1200:ed00:0:9089:6dac:96b6/128
~~~

Excluded IP-literal URL and rewrite targets:

~~~
103.44.58.64, 182.256.116.116, 47.101.175.206, 47.100.123.169
120.46.169.234, 121.36.72.124, 116.63.10.135, 117.185.228.108
117.144.238.29, 122.9.7.134, 101.91.140.124, 101.91.140.224
122.9.13.79, 122.9.15.129, 112.65.200.117, 112.64.218.119
114.116.215.110, 116.63.10.31, 180.76.76.112, 180.76.76.220
182.254.116.116, 119.29.29.98, 203.107.1.33, 203.107.1.34
162.14.3.250, 103.37.155.60, 81.69.130.131, 101.35.204.35
101.35.212.35, 114.110.96.6, 114.110.96.26, 114.110.97.30
114.110.97.97, 121.5.84.85, 103.41.167.237, 119.29.29.29
54.222.159.138:8053, 101.42.130.147:8053, 106.55.220.18:8053
139.196.12.179:8053, 203.107.1.1, 203.107.1.66, 203.107.1.67, 203.107.1.97
2402:4e00:1411:201:0:9964:ba21:5a41, 2401:b180:2000:30::1c, 2401:b180:2000:20::10
~~~

### General interception limits

The extension handles only visible hostname-based HTTP or HTTPS traffic on the
supported interception ports after the client resolves a captured hostname
through 5gpn. It cannot block raw DNS, UDP-only or non-HTTP protocols,
certificate-pinned clients, independently provisioned ECH, arbitrary ports, or
traffic using a hard-coded resolver IP that bypasses DNS steering. A client may
therefore fail closed or continue to bypass this extension, depending on its
connection behavior.

## Updating the port

1. Fetch the fixed source and verify its bytes before reviewing a change:

   ~~~bash
   curl -fsSLo Block_HTTPDNS.lpx \
     https://raw.githubusercontent.com/mihoyo-typ/KeleeOne/ab6c3182fb2b09bcc34456f496282ec0b8e9217b/Plugin/Block_HTTPDNS.lpx
   sha256sum Block_HTTPDNS.lpx
   ~~~

2. If updating to another upstream commit, record its immutable commit, raw
   URL, SHA-256, upstream-declared date, and review date in this README before
   changing the manifest.
3. Classify every changed source rule: keep DNS-only names in the DNS policy,
   translate only hostname-based HTTP or HTTPS request rejects to a bounded
   action, and add all unsupported IP, IPv6, non-HTTP, and non-steered rules to
   the exclusions above.
4. Preserve the source scheme and path scope. Do not turn a path-specific rule
   into a host-wide capture action. Keep captureHosts at or below 256 entries.
5. Bump metadata.version, validate the strict manifest, and review the snapshot
   digest in the Console before applying the disabled update.

## Verification

1. Confirm that the upstream file SHA-256 matches the pinned value above.
2. Install the manifest URL in the Console. Confirm that the reviewed manifest
   has six capture hosts, seven request actions, no network origins, and no
   required egress binding.
3. Enable the extension and the global interception master, then verify in
   /extensions/hosts that only the six declared hosts are active.
4. Send a request that matches each table row and verify that it fails closed;
   send a nearby nonmatching path on the same host and verify that the extension
   does not abort it.
5. Disable the extension and verify that its capture-host overlay disappears
   before relying on a DNS-policy-only block for the 58 names listed above.
