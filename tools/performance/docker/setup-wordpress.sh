#!/bin/bash
set -e

echo "========================================"
echo "Jetpack Performance Testing Setup"
echo "========================================"
echo ""

# Configuration from environment
WP_ADMIN_USER="${WP_ADMIN_USER:-admin}"
WP_ADMIN_PASS="${WP_ADMIN_PASS:-password}"
WP_ADMIN_EMAIL="${WP_ADMIN_EMAIL:-admin@example.com}"
WP_SITE_TITLE="Jetpack Performance Test"

# Database configuration
DB_HOST="${WORDPRESS_DB_HOST:-db}"
DB_USER="${WORDPRESS_DB_USER:-root}"
DB_PASS="${WORDPRESS_DB_PASSWORD:-rootpassword}"

# Function to setup a WordPress instance using WP-CLI
# NOTE: This script runs BEFORE WordPress containers start, so WP-CLI has
# exclusive access to the database. No race conditions are possible.
setup_instance() {
    local name=$1
    local wp_path=$2
    local site_url=$3
    local db_name=$4
    local activate_jetpack=$5

    echo ""
    echo "Setting up: $name"
    echo "----------------------------------------"
    echo "  Path: $wp_path"
    echo "  URL: $site_url"
    echo "  Database: $db_name"
    echo "  Activate Jetpack: $activate_jetpack"
    echo ""

    # Wait for WordPress files to be available (from Docker volume)
    local wait_count=0
    while [ ! -f "$wp_path/wp-includes/version.php" ]; do
        if [ $wait_count -ge 30 ]; then
            echo "  ✗ ERROR: WordPress files not found at $wp_path"
            return 1
        fi
        echo "  Waiting for WordPress files at $wp_path..."
        sleep 2
        wait_count=$((wait_count + 1))
    done
    echo "  ✓ WordPress files found"

    # Ensure database exists
    echo "  Ensuring database exists..."
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS \`$db_name\`;" || {
        echo "  ✗ ERROR: Failed to create database $db_name"
        return 1
    }
    echo "  ✓ Database exists"

    # Create wp-config.php
    local wp_config="$wp_path/wp-config.php"
    echo "  Creating wp-config.php..."

    # Generate unique salts
    generate_salt() {
        tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 64 || echo "fallback-salt-$(date +%s)-$RANDOM"
    }

    cat > "$wp_config" << WPCONFIG
<?php
define( 'DB_NAME', '$db_name' );
define( 'DB_USER', '$DB_USER' );
define( 'DB_PASSWORD', '$DB_PASS' );
define( 'DB_HOST', '$DB_HOST' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

\$table_prefix = 'wp_';

define( 'AUTH_KEY',         '$(generate_salt)' );
define( 'SECURE_AUTH_KEY',  '$(generate_salt)' );
define( 'LOGGED_IN_KEY',    '$(generate_salt)' );
define( 'NONCE_KEY',        '$(generate_salt)' );
define( 'AUTH_SALT',        '$(generate_salt)' );
define( 'SECURE_AUTH_SALT', '$(generate_salt)' );
define( 'LOGGED_IN_SALT',   '$(generate_salt)' );
define( 'NONCE_SALT',       '$(generate_salt)' );

define( 'WP_DEBUG', false );

// Keep the fixture network-hermetic. Without this, the fresh-install dashboard
// render makes synchronous calls to api.wordpress.org (browse-happy / version /
// update checks); on CI agents without egress those hang to a ~10s timeout and
// dominate the LCP measurement. Blocking external HTTP makes them fail fast.
// The wpcom connection simulator (mu-plugins/simulate-wpcom-connection.php)
// short-circuits via the pre_http_request filter, which WordPress runs before
// this block check, so the simulated connection still resolves.
define( 'WP_HTTP_BLOCK_EXTERNAL', true );

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
WPCONFIG
    echo "  ✓ wp-config.php created"

    # Install WordPress
    echo "  Installing WordPress..."
    wp core install \
        --path="$wp_path" \
        --url="$site_url" \
        --title="$WP_SITE_TITLE - $name" \
        --admin_user="$WP_ADMIN_USER" \
        --admin_password="$WP_ADMIN_PASS" \
        --admin_email="$WP_ADMIN_EMAIL" \
        --skip-email || {
            echo "  ✗ ERROR: WordPress installation failed"
            return 1
        }
    echo "  ✓ WordPress installed"

    # Activate Jetpack if requested
    if [ "$activate_jetpack" = "true" ]; then
        if [ -d "$wp_path/wp-content/plugins/jetpack" ]; then
            echo "  Activating Jetpack..."
            wp plugin activate jetpack --path="$wp_path" || {
                echo "  ⚠ Warning: Failed to activate Jetpack"
            }
        else
            echo "  ⚠ Warning: Jetpack plugin not found at $wp_path/wp-content/plugins/jetpack"
        fi
    fi

    # Flush rewrite rules
    wp rewrite flush --path="$wp_path" 2>/dev/null || true

    echo "  ✓ Setup complete for $name"
}

# Wait for database to be ready
echo "Waiting for database..."
max_db_attempts=30
db_attempt=1
while [ $db_attempt -le $max_db_attempts ]; do
    if mysqladmin ping -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" --silent 2>/dev/null; then
        echo "✓ Database is ready"
        break
    fi
    echo "  Attempt $db_attempt/$max_db_attempts..."
    sleep 2
    db_attempt=$((db_attempt + 1))
done

if [ $db_attempt -gt $max_db_attempts ]; then
    echo "✗ ERROR: Database did not become ready"
    exit 1
fi

echo ""
echo "Setting up WordPress instance..."
echo "NOTE: WordPress container is not running yet - WP-CLI has exclusive database access"
echo ""

# Setup the WordPress instance with Jetpack connected (simulated)
setup_instance \
    "Jetpack Connected (Simulated)" \
    "/var/www/html/jetpack-connected" \
    "http://localhost:8083" \
    "wp_jetpack_connected" \
    "true"

echo ""
echo "========================================"
echo "✓ Setup Complete!"
echo "========================================"
echo ""
echo "WordPress instance is configured."
echo "Port is assigned dynamically - the test runner will discover it."
echo ""
echo "Admin credentials:"
echo "  Username: $WP_ADMIN_USER"
echo "  Password: $WP_ADMIN_PASS"
echo ""
