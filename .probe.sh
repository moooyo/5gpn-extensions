#!/bin/sh
echo "=== where are the binaries ==="
for u in 5gpn-dns 5gpn-intercept; do
  p=$(systemctl show -p ExecStart --value "$u" 2>/dev/null | sed -n 's/.*path=\([^ ;]*\).*/\1/p')
  printf '%-16s unit-path=%s\n' "$u" "${p:-?}"
  [ -n "$p" ] && ls -la "$p" 2>/dev/null
done
echo
echo "=== versions ==="
for u in 5gpn-dns 5gpn-intercept; do
  p=$(systemctl show -p ExecStart --value "$u" 2>/dev/null | sed -n 's/.*path=\([^ ;]*\).*/\1/p')
  [ -x "$p" ] && printf '%-16s %s\n' "$u" "$("$p" --version 2>&1 | head -1)"
done
echo
echo "=== how was it installed ==="
ls -la /opt/5gpn /usr/lib/5gpn /srv/5gpn 2>/dev/null | head -10
find / -maxdepth 3 -name 'install.sh' -path '*5gpn*' 2>/dev/null | head -3
echo
echo "=== apt/systemd units ==="
ls /etc/systemd/system/ | grep -i 5gpn
