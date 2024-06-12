<?php
/**
 * Constants file.
 *
 * @package wpcomsh
 */

$current_dir = __DIR__;

// Base paths containing the location of WP.com and storefront themes, defined in Atomic.
if ( ! defined( 'THEMES_SYMLINK_BASE' ) || ! defined( 'THEMES_PATH_BASE' ) ) {
	define( 'THEMES_SYMLINK_BASE', $current_dir );
	define( 'THEMES_PATH_BASE', $current_dir );
}

define( 'WPCOMSH_PUB_THEMES_PATH', THEMES_PATH_BASE . '/pub' );
define( 'WPCOMSH_PREMIUM_THEMES_PATH', THEMES_PATH_BASE . '/premium' );
define( 'WPCOMSH_STOREFRONT_PATH', THEMES_PATH_BASE . '/storefront' );

define( 'WPCOMSH_PUB_THEMES_SYMLINK', THEMES_SYMLINK_BASE . '/pub' );
define( 'WPCOMSH_PREMIUM_THEMES_SYMLINK', THEMES_SYMLINK_BASE . '/premium' );
define( 'WPCOMSH_STOREFRONT_SYMLINK', THEMES_SYMLINK_BASE . '/storefront' );

define( 'WPCOMSH_PUB_THEME_TYPE', 'wpcom_pub_theme_type' );
define( 'WPCOMSH_PREMIUM_THEME_TYPE', 'wpcom_premium_theme_type' );
define( 'WPCOMSH_NON_WPCOM_THEME', 'non_wpcom_theme' );

define( 'WPCOMSH__PLUGIN_DIR_PATH', WP_CONTENT_DIR . '/mu-plugins/wpcomsh' );
define( 'WPCOMSH__PLUGIN_FILE', WPCOMSH__PLUGIN_DIR_PATH . '/wpcomsh.php' );

// Enable Jetpack's Experimental blocks.
define( 'JETPACK_BLOCKS_VARIATION', 'experimental' );

// Date for lowering storage from 200 GB to 50 GB for business and higher plans. Ref: D108151-code.
define( 'LEGACY_200GB_CUTOFF_DATE', '2023-07-20' );
