#!/bin/sh
rm -rf /etc/5gpn
rm -f /tmp/install.log /tmp/certwatch.txt
# Snapshot the cert root the moment it appears, before the run can roll it back.
(
  i=0
  while [ $i -lt 600 ]; do
    if [ -e /etc/5gpn/cert ]; then
      { echo "=== first sighting ==="; ls -lad /etc/5gpn/cert; ls -la /etc/5gpn/cert; } >> /tmp/certwatch.txt 2>&1
      sleep 1
      { echo "=== +1s ==="; ls -lad /etc/5gpn/cert; ls -laR /etc/5gpn/cert; } >> /tmp/certwatch.txt 2>&1
      exit 0
    fi
    i=$((i + 1))
    sleep 0.2
  done
) &
setsid nohup /tmp/run.sh < /dev/null > /dev/null 2>&1 &
echo started
