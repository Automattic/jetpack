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

    echo ""
    echo "Setting up: $name"
    echo "----------------------------------------"
    echo "  Path: $wp_path"
    echo "  URL: $site_url"
    echo "  Database: $db_name"
    echo "  Activate Jetpack: $activate_jetpack"
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

    # Create wp-config.php for WP-CLI to use with the correct database
    local wp_config="$wp_path/wp-config.php"

    # Always regenerate wp-config.php to ensure DB credentials are current
    if [ -f "$wp_config" ]; then
        echo "  Removing existing wp-config.php to regenerate with current settings"
        rm -f "$wp_config"
    fi
    echo "  Creating wp-config.php for database: $db_name (host: $DB_HOST)"

    # Generate unique salts for this instance using /dev/urandom
    generate_salt() {
        tr -dc 'a-zA-Z0-9' < /dev/urandom | head -c 64 || echo "fallback-salt-$(date +%s)-$RANDOM-$$"
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

    # Check if WordPress is already installed
    if wp core is-installed --path="$wp_path" 2>/dev/null; then
        echo "  ✓ WordPress already installed"
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
            local max_drop_attempts=5
            local drop_attempt=1
            local table_count=999

            while [ $drop_attempt -le $max_drop_attempts ] && [ "$table_count" != "0" ]; do
                echo "  Dropping and recreating database: $db_name (attempt $drop_attempt)"
                mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "DROP DATABASE IF EXISTS \`$db_name\`; CREATE DATABASE \`$db_name\`;" || {
                    echo "  ✗ ERROR: Failed to recreate database"
                    return 1
                }

                # Check immediately - minimize window for race condition
                table_count=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$db_name';" 2>/dev/null || echo "error")

                if [ "$table_count" != "0" ] && [ "$table_count" != "error" ]; then
                    echo "  Warning: Database not empty after DROP/CREATE, retrying..."
                    sleep 0.5
                fi

                drop_attempt=$((drop_attempt + 1))
            done

            if [ "$table_count" != "0" ]; then
                echo "  ✗ ERROR: Could not get empty database after $max_drop_attempts attempts"
                return 1
            fi

            # Retry installation with fresh empty database
            echo "  Retrying WordPress installation..."
            wp core install \
                --path="$wp_path" \
                --url="$site_url" \
                --title="$WP_SITE_TITLE - $name" \
                --admin_user="$WP_ADMIN_USER" \
                --admin_password="$WP_ADMIN_PASS" \
                --admin_email="$WP_ADMIN_EMAIL" \
                --skip-email || {
                    echo "  ✗ ERROR: WordPress installation failed after database repair"
                    return 1
                }
        fi

        echo "  ✓ WordPress installed"

        # Verify wp_users table exists (critical for login)
        if ! mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -N -e "SELECT 1 FROM information_schema.tables WHERE table_schema='$db_name' AND table_name='wp_users' LIMIT 1;" 2>/dev/null | grep -q 1; then
            echo "  ✗ ERROR: WordPress installation incomplete - wp_users table missing"
            return 1
        fi

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

# Wait for WordPress container
echo ""
echo "Waiting for WordPress container..."
wait_for_wordpress "wordpress-jetpack-connected" "wordpress-jetpack-connected"

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
echo "WordPress instance is ready."
echo "Port is assigned dynamically - the test runner will discover it."
echo ""
echo "Admin credentials:"
echo "  Username: $WP_ADMIN_USER"
echo "  Password: $WP_ADMIN_PASS"
echo ""
