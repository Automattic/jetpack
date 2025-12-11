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

# Function to wait for a WordPress container to be ready
wait_for_wordpress() {
    local name=$1
    local host=$2
    local max_attempts=60
    local attempt=1

    echo "Waiting for $name ($host) to be ready..."

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "http://$host/" > /dev/null 2>&1 || curl -sf "http://$host/wp-login.php" > /dev/null 2>&1; then
            echo "  ✓ $name is responding"
            return 0
        fi
        echo "  Attempt $attempt/$max_attempts - waiting..."
        sleep 2
        attempt=$((attempt + 1))
    done

    echo "  ✗ ERROR: $name did not become ready"
    return 1
}

# Function to setup a WordPress instance using WP-CLI
setup_instance() {
    local name=$1
    local wp_path=$2
    local site_url=$3
    local db_name=$4
    local activate_jetpack=$5
    local config_extra=${6:-""}  # Optional extra PHP config to add to wp-config.php

    echo ""
    echo "Setting up: $name"
    echo "----------------------------------------"
    echo "  Path: $wp_path"
    echo "  URL: $site_url"
    echo "  Database: $db_name"
    echo "  Activate Jetpack: $activate_jetpack"
    if [ -n "$config_extra" ]; then
        echo "  Config Extra: (custom PHP constants)"
    fi
    echo ""

    # Wait for WordPress files to be available
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

    # Create a local wp-config.php for WP-CLI to use with the correct database
    # This is needed because the Docker wp-config uses getenv_docker() which
    # doesn't work the same way in the WP-CLI container
    local wp_config="$wp_path/wp-config.php"

    # Always regenerate wp-config.php to ensure DB credentials are current
    # This prevents stale config from pointing to wrong DB after env changes
    if [ -f "$wp_config" ]; then
        echo "  Removing existing wp-config.php to regenerate with current settings"
        rm -f "$wp_config"
    fi
    echo "  Creating wp-config.php for database: $db_name (host: $DB_HOST)"

    # Log if config_extra is being included (passed as 6th parameter)
    if [ -n "$config_extra" ]; then
        echo "  Including extra config in wp-config.php"
    fi

    # Generate unique salts for this instance using /dev/urandom
    # Using alphanumeric characters only to avoid any potential PHP string escaping issues
    generate_salt() {
        tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 64 || echo "fallback-salt-$(date +%s)-$RANDOM"
    }

    local AUTH_KEY_SALT=$(generate_salt)
    local SECURE_AUTH_KEY_SALT=$(generate_salt)
    local LOGGED_IN_KEY_SALT=$(generate_salt)
    local NONCE_KEY_SALT=$(generate_salt)
    local AUTH_SALT_SALT=$(generate_salt)
    local SECURE_AUTH_SALT_SALT=$(generate_salt)
    local LOGGED_IN_SALT_SALT=$(generate_salt)
    local NONCE_SALT_SALT=$(generate_salt)

    cat > "$wp_config" << WPCONFIG
<?php
define( 'DB_NAME', '$db_name' );
define( 'DB_USER', '$DB_USER' );
define( 'DB_PASSWORD', '$DB_PASS' );
define( 'DB_HOST', '$DB_HOST' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

\$table_prefix = 'wp_';

define( 'AUTH_KEY',         '$AUTH_KEY_SALT' );
define( 'SECURE_AUTH_KEY',  '$SECURE_AUTH_KEY_SALT' );
define( 'LOGGED_IN_KEY',    '$LOGGED_IN_KEY_SALT' );
define( 'NONCE_KEY',        '$NONCE_KEY_SALT' );
define( 'AUTH_SALT',        '$AUTH_SALT_SALT' );
define( 'SECURE_AUTH_SALT', '$SECURE_AUTH_SALT_SALT' );
define( 'LOGGED_IN_SALT',   '$LOGGED_IN_SALT_SALT' );
define( 'NONCE_SALT',       '$NONCE_SALT_SALT' );

define( 'WP_DEBUG', false );

// Auto-detect site URL from request (supports dynamic ports)
if ( isset( \$_SERVER['HTTP_HOST'] ) ) {
    \$protocol = ( ! empty( \$_SERVER['HTTPS'] ) && \$_SERVER['HTTPS'] !== 'off' ) ? 'https' : 'http';
    define( 'WP_HOME', \$protocol . '://' . \$_SERVER['HTTP_HOST'] );
    define( 'WP_SITEURL', \$protocol . '://' . \$_SERVER['HTTP_HOST'] );
}

$config_extra

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
WPCONFIG
    echo "  ✓ wp-config.php created"

    # Check if WordPress is already installed
    if wp core is-installed --path="$wp_path" 2>/dev/null; then
        echo "  ✓ WordPress already installed"
    else
        echo "  Installing WordPress..."

        # Install WordPress core
        wp core install \
            --path="$wp_path" \
            --url="$site_url" \
            --title="$WP_SITE_TITLE - $name" \
            --admin_user="$WP_ADMIN_USER" \
            --admin_password="$WP_ADMIN_PASS" \
            --admin_email="$WP_ADMIN_EMAIL" \
            --skip-email

        echo "  ✓ WordPress installed"
    fi

    # Activate Jetpack if requested and it exists
    if [ "$activate_jetpack" = "true" ]; then
        if [ -d "$wp_path/wp-content/plugins/jetpack" ]; then
            echo "  Activating Jetpack..."
            if wp plugin is-active jetpack --path="$wp_path" 2>/dev/null; then
                echo "  ✓ Jetpack already active"
            else
                wp plugin activate jetpack --path="$wp_path" || {
                    echo "  ⚠ Warning: Failed to activate Jetpack (may need dependencies)"
                }
            fi
        else
            echo "  ⚠ Warning: Jetpack plugin not found at $wp_path/wp-content/plugins/jetpack"
            echo "    Make sure Jetpack is built: pnpm jetpack build plugins/jetpack"
        fi
    fi

    # Update site URL
    wp option update siteurl "$site_url" --path="$wp_path" 2>/dev/null || true
    wp option update home "$site_url" --path="$wp_path" 2>/dev/null || true

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

# Wait for WordPress containers
echo ""
echo "Waiting for WordPress containers..."
wait_for_wordpress "wordpress-baseline" "wordpress-baseline"
wait_for_wordpress "wordpress-jetpack" "wordpress-jetpack"
wait_for_wordpress "wordpress-jetpack-offline" "wordpress-jetpack-offline"
wait_for_wordpress "wordpress-jetpack-connected" "wordpress-jetpack-connected"

# Setup each instance
# The WP-CLI container has volumes mounted at different paths

# Scenario 1: Baseline (no Jetpack)
setup_instance \
    "Baseline" \
    "/var/www/html/baseline" \
    "http://localhost:8080" \
    "wp_baseline" \
    "false"

# Scenario 2: Jetpack (not connected)
setup_instance \
    "Jetpack Disconnected" \
    "/var/www/html/jetpack" \
    "http://localhost:8081" \
    "wp_jetpack" \
    "true"

# Scenario 3: Jetpack Offline Mode
# Pass JETPACK_DEV_DEBUG as 6th parameter to include in wp-config.php
# Note: This is intentionally redundant with WORDPRESS_CONFIG_EXTRA in docker-compose.yml
# Both set JETPACK_DEV_DEBUG=true as a belt-and-suspenders approach to ensure offline mode works
# regardless of whether Docker's config injection or WP-CLI setup runs first
setup_instance \
    "Jetpack Offline Mode" \
    "/var/www/html/jetpack-offline" \
    "http://localhost:8082" \
    "wp_jetpack_offline" \
    "true" \
    "define( 'JETPACK_DEV_DEBUG', true );"

# Scenario 4: Jetpack Connected (Simulated)
# The mu-plugin handles fake tokens and API mocking
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
echo "WordPress instances are ready at:"
echo "  Baseline:                  http://localhost:8080/wp-admin/"
echo "  Jetpack Disconnected:      http://localhost:8081/wp-admin/"
echo "  Jetpack Offline Mode:      http://localhost:8082/wp-admin/"
echo "  Jetpack Connected (Sim):   http://localhost:8083/wp-admin/"
echo ""
echo "Admin credentials:"
echo "  Username: $WP_ADMIN_USER"
echo "  Password: $WP_ADMIN_PASS"
echo ""
