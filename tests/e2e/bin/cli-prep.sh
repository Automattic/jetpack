#!/bin/bash

# Exit if any command fails.
set -e

SITE_TITLE='E2E Testing'
WP_SITE_URL=${1}
WP_CORE_DIR=${2-$PWD}

# Reset the database so no posts/comments/etc.
echo -e  "Resetting test database..."
wp db reset --yes --quiet

# Install WordPress.
echo -e "Installing WordPress..."
wp core install --title="$SITE_TITLE" --admin_user=wordpress --admin_password=wordpress --admin_email=test@example.com --skip-email --url=$WP_SITE_URL --path=$WP_CORE_DIR --quiet

if [ -z $CI ]; then
	echo -e "Setting up dynamic WP_HOME & SITE_URL..."
	wp config set WP_SITEURL "'http://' . \$_SERVER['HTTP_HOST']" --raw --type=constant --quiet
	wp config set WP_HOME "'http://' . \$_SERVER['HTTP_HOST']" --raw --type=constant --quiet
fi

echo -e "Configuring site constants..."
wp config set WP_DEBUG true --raw --type=constant --quiet
wp config set WP_DEBUG_LOG true --raw --type=constant --quiet
wp config set WP_DEBUG_DISPLAY false --raw --type=constant --quiet
wp config set JETPACK_BETA_BLOCKS true --raw --type=constant --quiet

# NOTE: Force classic connection flow
# https://github.com/Automattic/jetpack/pull/13288
wp config set JETPACK_SHOULD_NOT_USE_CONNECTION_IFRAME true --raw --type=constant --quiet
