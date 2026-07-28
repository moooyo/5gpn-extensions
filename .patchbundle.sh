#!/bin/sh
set -e
B=$(ls -dt /tmp/5gpn-installer.* 2>/dev/null | grep -v tar.gz | head -1)
[ -n "$B" ] || { echo "no extracted bundle"; exit 1; }
echo "bundle: $B"
# Only the permission digits decide claimability for roots created under the
# setgid CONF_DIR; five-digit chmod is what actually clears the inherited bit.
perl -0pi -e 's/(\n(\s*)mode="\$\(file_mode "\$(?:DNS_CERT_DIR|DEBUG_CERT_DIR)"\)"\n)(?!\s*mode="\$\{mode)/$1$2mode="\$\{mode: -3\}"\n/g' "$B/install.sh"
perl -pi -e 's/chmod 0751 "\$DNS_CERT_DIR"/chmod 00751 "\$DNS_CERT_DIR"/g; s/chmod 0700 "\$DEBUG_CERT_DIR"/chmod 00700 "\$DEBUG_CERT_DIR"/g' "$B/install.sh"
echo "patched:"
grep -nE 'mode: -3|chmod 00751 "\$DNS_CERT_DIR"|chmod 00700 "\$DEBUG_CERT_DIR"' "$B/install.sh"
bash -n "$B/install.sh" && echo "syntax OK"
rm -rf /etc/5gpn
rm -f /tmp/install.log
setsid nohup /tmp/run3.sh < /dev/null > /dev/null 2>&1 &
echo started
