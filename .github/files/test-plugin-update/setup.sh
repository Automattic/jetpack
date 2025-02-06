#!/bin/bash

set -eo pipefail

echo "::group::Setup database"
cat <<EOF > ~/.my.cnf
[client]
host=${MYSQL_HOST%:*}
port=${MYSQL_HOST#*:}
user=$MYSQL_USER
password=$MYSQL_PASSWORD
EOF
chmod 0600 ~/.my.cnf
mysql -e "set global wait_timeout = 3600;"
mysql -e "drop database if exists wordpress;"
mysql -e "create database wordpress;"
echo "::endgroup::"

echo "::group::Setup WordPress"
mkdir -p /var/log/php/ /var/scripts/
cd /var/www/html
sed -i 's/apachectl -D FOREGROUND/apachectl start/' /usr/local/bin/run
echo '#!/bin/bash' > /var/scripts/run-extras.sh
/usr/local/bin/run
echo "::endgroup::"

echo "::group::Install WordPress"
wp --allow-root core install --url="$WP_DOMAIN" --title="$WP_TITLE" --admin_user="$WP_ADMIN_USER" --admin_password="$WP_ADMIN_PASSWORD" --admin_email="$WP_ADMIN_EMAIL" --skip-email
rm -f index.html
mkdir -p wp-content/mu-plugins
cp "$GITHUB_WORKSPACE/trunk/.github/files/test-plugin-update/mu-plugin.php" wp-content/mu-plugins/hack.php
echo "::endgroup::"

echo "::group::Backing up database"
wp --allow-root db export "$GITHUB_WORKSPACE/db.sql"
echo "::endgroup::"
