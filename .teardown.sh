#!/bin/sh
# Full teardown. This host is a disposable test environment.
set -x
systemctl stop 5gpn-dns 5gpn-intercept 5gpn-intercept-cert.timer 2>/dev/null
systemctl disable 5gpn-dns 5gpn-intercept 5gpn-intercept-cert.timer 5gpn-intercept-cert.path 5gpn-intercept-runtime.path 2>/dev/null
rm -f /etc/systemd/system/5gpn-*.service /etc/systemd/system/5gpn-*.timer /etc/systemd/system/5gpn-*.path
rm -f /etc/systemd/system/multi-user.target.wants/5gpn-* 2>/dev/null
systemctl daemon-reload
rm -rf /opt/5gpn /etc/5gpn /var/lib/5gpn /var/log/5gpn
rm -f /usr/local/bin/5gpn /usr/local/bin/5gpn-dns /usr/local/bin/5gpn-intercept
rm -rf /tmp/5gpn-installer.* /tmp/5gpn-*
set +x
echo "=== residue ==="
ls -d /opt/5gpn /etc/5gpn /var/lib/5gpn 2>/dev/null || echo "  (none)"
systemctl list-units --all 2>/dev/null | grep -i 5gpn || echo "  (no units)"
echo "=== mihomo ==="
systemctl is-active mihomo 2>/dev/null
ls -d /etc/mihomo /opt/mihomo 2>/dev/null
