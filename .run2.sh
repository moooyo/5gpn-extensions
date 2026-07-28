#!/bin/sh
rm -rf /etc/5gpn
rm -f /tmp/install.log
cat > /tmp/run2.sh <<'INNER'
#!/bin/sh
script -qec "bash /tmp/patched/install.sh" /dev/null < /tmp/answers.txt > /tmp/install.log 2>&1
echo "EXIT=$?" >> /tmp/install.log
INNER
chmod +x /tmp/run2.sh
setsid nohup /tmp/run2.sh < /dev/null > /dev/null 2>&1 &
echo started
