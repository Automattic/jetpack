#!/bin/sh -l

echo "Hello $1"
time=$(date)
echo "::set-output name=time::$time"


which wp || exit 0

sudo apt update
sudo apt install -y php-fpm nginx
sudo systemctl start mysql.service
ls -la ./tests/e2e/bin/
