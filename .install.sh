#!/bin/sh
set -e
cd /tmp
rm -rf /etc/5gpn
rm -f install.log
curl -fsSL https://raw.githubusercontent.com/moooyo/5gpn/main/quick-install.sh -o /tmp/qi.sh
printf '3\n5gpn.test\n10.0.1.20\n10.0.1.20\n10.0.1.20\ny\ny\ny\ny\ny\ny\n' > /tmp/answers.txt
cat > /tmp/run.sh <<'INNER'
#!/bin/sh
script -qec "bash /tmp/qi.sh" /dev/null < /tmp/answers.txt > /tmp/install.log 2>&1
echo "EXIT=$?" >> /tmp/install.log
INNER
chmod +x /tmp/run.sh
setsid nohup /tmp/run.sh < /dev/null > /dev/null 2>&1 &
echo started
