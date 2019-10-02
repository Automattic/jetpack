#!/bin/sh

echo "Waiting on db to be ready...";
sh /usr/local/bin/wait-for db:3306 -t 30 || exit 1;

echo "***** Making sure WordPress is installed";
wp core install --url="http://localhost:8989" --title="wpcomsh test" --admin_user="admin" --admin_password="9f0jiajfsjf930jfs" --admin_email="nobody@example.com";

echo "Emptying site";
wp site empty --yes;

echo "Setting permalink format";
wp rewrite structure "/%year%/%monthnum%/%postname%/";

echo "Adding test content";
POST_ID=`wp post create --post_title="this is a test post" --post_status="publish"`;

echo "Enabling the private site module settings (TODO: Remove this when this is launched)";
wp option update wpcomsh_private_site_module_active 1;

if [ "$1" = "private" ]; then
  echo "Setting the option to indicate the private site setting has been updated since the module was active";
  wp option update wpcom_blog_public_updated 1;

  echo "Setting site to private";
  wp option update blog_public -1;
else
  echo "Setting site to public";
  wp option update blog_public 1;
fi

echo "Activating wpcomsh plugin";
wp plugin activate wpcomsh;

echo "Initialized!";
