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

# NOTE: We removed the wait_for_wordpress() function that used to curl WordPress containers.
# Sending HTTP requests to WordPress containers before WP-CLI runs causes a race condition
# where WordPress PHP and WP-CLI both try to create database tables simultaneously.

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
    echo "  [DIAG] Timestamp: $(date -u +%Y-%m-%dT%H:%M:%S.%3NZ 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)"
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

$config_extra

if ( ! defined( 'ABSPATH' ) ) {
    define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
WPCONFIG
    echo "  ✓ wp-config.php created"

    # Ensure database exists (may be missing if init-databases.sql didn't run)
    echo "  Ensuring database exists..."
    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "CREATE DATABASE IF NOT EXISTS \`$db_name\`;" || {
        echo "  ✗ ERROR: Failed to create database $db_name"
        return 1
    }

    # Verify the database is accessible before proceeding
    # This prevents race conditions where CREATE DATABASE succeeds but the DB isn't immediately usable
    local db_verify_attempts=0
    local db_max_verify=10
    while [ $db_verify_attempts -lt $db_max_verify ]; do
        if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "USE \`$db_name\`; SELECT 1;" >/dev/null 2>&1; then
            echo "  ✓ Database $db_name is accessible"
            break
        fi
        db_verify_attempts=$((db_verify_attempts + 1))
        if [ $db_verify_attempts -lt $db_max_verify ]; then
            echo "  Waiting for database $db_name to be accessible (attempt $db_verify_attempts/$db_max_verify)..."
            sleep 1
        fi
    done

    if [ $db_verify_attempts -ge $db_max_verify ]; then
        echo "  ✗ ERROR: Database $db_name not accessible after $db_max_verify attempts"
        return 1
    fi

    # DIAGNOSTIC: Check database state BEFORE installation
    echo "  [DIAG] Pre-install database state for $db_name:"
    local pre_table_count=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$db_name';" 2>/dev/null || echo "error")
    echo "  [DIAG]   Table count: $pre_table_count"
    if [ "$pre_table_count" != "0" ] && [ "$pre_table_count" != "error" ]; then
        echo "  [DIAG]   Tables found (unexpected on fresh install):"
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT table_name FROM information_schema.tables WHERE table_schema='$db_name';" 2>/dev/null | while read tbl; do
            echo "  [DIAG]     - $tbl"
        done
    fi

    # Check if WordPress is already installed
    echo "  [DIAG] Running: wp core is-installed --path=$wp_path"
    if wp core is-installed --path="$wp_path" 2>/dev/null; then
        echo "  ✓ WordPress already installed"
        # Diagnostic: verify existing installation state
        echo "  Diagnostic: verifying existing installation..."
        echo "  Users:"
        wp user list --path="$wp_path" --fields=ID,user_login,roles 2>&1 | head -3 || echo "    (could not list users)"
    else
        echo "  Installing WordPress..."

        # Try to install WordPress core
        # If it fails due to corrupted tables, drop the database and retry
        if ! wp core install \
            --path="$wp_path" \
            --url="$site_url" \
            --title="$WP_SITE_TITLE - $name" \
            --admin_user="$WP_ADMIN_USER" \
            --admin_password="$WP_ADMIN_PASS" \
            --admin_email="$WP_ADMIN_EMAIL" \
            --skip-email 2>&1; then

            echo "  ⚠ Installation failed, attempting database repair..."

            # Drop and recreate the database, ensuring it's truly empty
            # WordPress containers may create tables if they get requests, so we loop until empty
            local max_drop_attempts=5
            local drop_attempt=1
            local table_count=999

            while [ $drop_attempt -le $max_drop_attempts ] && [ "$table_count" != "0" ]; do
                echo "  Dropping and recreating database: $db_name (attempt $drop_attempt)"
                mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "DROP DATABASE IF EXISTS \`$db_name\`; CREATE DATABASE \`$db_name\`;" || {
                    echo "  ✗ ERROR: Failed to recreate database"
                    return 1
                }

                # Check immediately - minimize window for race condition with WordPress container
                table_count=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$db_name';" 2>/dev/null || echo "error")
                echo "  [DIAG] Tables in $db_name after DROP/CREATE: $table_count"

                if [ "$table_count" != "0" ] && [ "$table_count" != "error" ]; then
                    echo "  [DIAG] WARNING: Tables appeared after DROP/CREATE! Listing them:"
                    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT table_name FROM information_schema.tables WHERE table_schema='$db_name';" 2>/dev/null | while read tbl; do
                        echo "  [DIAG]   - $tbl"
                    done
                    echo "  [DIAG] Checking MySQL process list for active connections:"
                    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT id, user, host, db, command, time, state FROM information_schema.processlist WHERE db='$db_name' OR db IS NULL;" 2>/dev/null | head -10 || echo "  [DIAG]   (could not get process list)"
                    sleep 0.5  # Brief wait before retry
                fi

                drop_attempt=$((drop_attempt + 1))
            done

            if [ "$table_count" != "0" ]; then
                echo "  ✗ ERROR: Could not get empty database after $max_drop_attempts attempts"
                return 1
            fi

            # Retry installation with fresh empty database
            echo "  [DIAG] Database confirmed empty. Retrying WordPress installation..."
            wp core install \
                --path="$wp_path" \
                --url="$site_url" \
                --title="$WP_SITE_TITLE - $name" \
                --admin_user="$WP_ADMIN_USER" \
                --admin_password="$WP_ADMIN_PASS" \
                --admin_email="$WP_ADMIN_EMAIL" \
                --skip-email || {
                    echo "  ✗ ERROR: WordPress installation failed after database repair"
                    echo "  [DIAG] Post-failure database state:"
                    mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT table_name FROM information_schema.tables WHERE table_schema='$db_name';" 2>/dev/null | while read tbl; do
                        echo "  [DIAG]   - $tbl"
                    done
                    return 1
                }

            # DIAGNOSTIC: Show what tables were created by the retry
            echo "  [DIAG] Post-retry installation table count:"
            local post_retry_count=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$db_name';" 2>/dev/null || echo "error")
            echo "  [DIAG]   Tables created: $post_retry_count"
        fi

        echo "  ✓ WordPress installed"

        # Verify wp_users table exists (critical for login)
        if ! mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT 1 FROM information_schema.tables WHERE table_schema='$db_name' AND table_name='wp_users' LIMIT 1;" 2>/dev/null | grep -q 1; then
            echo "  ✗ ERROR: WordPress installation incomplete - wp_users table missing"
            echo "  This indicates a race condition with WordPress container creating partial tables."
            return 1
        fi

        # Diagnostic: verify installation state
        echo "  Diagnostic: verifying installation state..."
        echo "  Tables:"
        wp db tables --path="$wp_path" 2>&1 | head -5 || echo "    (could not list tables)"
        echo "  Users:"
        wp user list --path="$wp_path" --fields=ID,user_login,roles 2>&1 | head -5 || echo "    (could not list users)"

        # Ensure admin user exists (may be missing after database repair)
        if ! wp user get "$WP_ADMIN_USER" --path="$wp_path" > /dev/null 2>&1; then
            echo "  ⚠ Admin user missing, creating..."
            wp user create "$WP_ADMIN_USER" "$WP_ADMIN_EMAIL" \
                --role=administrator \
                --user_pass="$WP_ADMIN_PASS" \
                --path="$wp_path" || {
                    echo "  ✗ ERROR: Failed to create admin user"
                    return 1
                }
        else
            echo "  ✓ Admin user exists"
        fi
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

# NOTE: We deliberately do NOT wait for WordPress containers with HTTP checks before setup.
# The WordPress Docker image auto-initializes wp-config.php and may try to install WordPress
# when it receives ANY HTTP request. If we curl the containers before WP-CLI runs wp core install,
# we create a race condition where both WordPress (via Apache) and WP-CLI try to create tables
# simultaneously, causing "table doesn't exist" errors.
#
# Instead, we only wait for the WordPress FILES to be available (checked in setup_instance)
# and let WP-CLI do all the database setup before any HTTP traffic hits the containers.

echo ""
echo "Skipping WordPress container HTTP checks (to avoid race conditions)"
echo "WP-CLI will perform installation directly using the database"
echo ""

# DIAGNOSTIC: Check state of ALL databases before any setup
echo ""
echo "[DIAG] ============================================"
echo "[DIAG] Pre-setup database state (before any setup_instance runs)"
echo "[DIAG] Timestamp: $(date -u +%Y-%m-%dT%H:%M:%S.%3NZ 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "[DIAG] ============================================"
for db in wp_baseline wp_jetpack wp_jetpack_offline wp_jetpack_connected; do
    table_count=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$db';" 2>/dev/null || echo "DB_NOT_FOUND")
    echo "[DIAG] $db: $table_count tables"
    if [ "$table_count" != "0" ] && [ "$table_count" != "DB_NOT_FOUND" ]; then
        mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT table_name FROM information_schema.tables WHERE table_schema='$db';" 2>/dev/null | while read tbl; do
            echo "[DIAG]   - $tbl"
        done
    fi
done
echo "[DIAG] ============================================"
echo ""

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
echo "WordPress instances are ready."
echo "Ports are assigned dynamically - the test runner will discover them."
echo ""
echo "Admin credentials:"
echo "  Username: $WP_ADMIN_USER"
echo "  Password: $WP_ADMIN_PASS"
echo ""
