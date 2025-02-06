#!/bin/sh

echo "Waiting on db to be ready...";
sh /usr/local/bin/wait-for db:3306 -t 30 || exit 1;

echo "***** Making sure WordPress is installed";
wp core install --url="http://nginx:8989" --title="wpcomsh test" --admin_user="admin" --admin_password="password" --admin_email="nobody@example.com";

echo "Emptying site";
wp site empty --yes;

echo "Setting permalink format";
wp rewrite structure "/%year%/%monthnum%/%postname%/";

echo "Adding test content";
POST_ID=`wp post create --post_title="this is a test post" --post_status="publish"`;

echo "Linking the wpcomsh-loader.php file into mu-plugins";
ln -s /var/www/html/wp-content/mu-plugins/wpcomsh/wpcomsh-loader.php /var/www/html/wp-content/mu-plugins/wpcomsh-loader.php

echo "Defining various constants in a mini-plugin";
echo "<?php

if ( ! defined( 'IS_ATOMIC' ) ) {
  define( 'IS_ATOMIC', 1 );
}
" > wp-content/mu-plugins/0-wpcomsh-early-constants.php

if [ "$1" = "private" ]; then
  echo "Setting the constant to indicate the site is private";
  echo "define( 'AT_PRIVACY_MODEL', 'wp_uploads' );
" >> wp-content/mu-plugins/0-wpcomsh-early-constants.php

fi

echo "Initialized!";
