<?php

$current_dir = dirname( __FILE__ );

// The following constants need to be defined outside of this file (in e.g.: wp-config.php).
// There are two pairs of them due to how Pressable works.
// More context: p1487627254008092-slack-faster-transfers
if (
	// Paths to the location of WP.com pub/premium and storefront themes. Used for everything except symlinking.
	! defined( 'WPCOMSH_PUB_THEMES_PATH' ) ||
	! defined( 'WPCOMSH_PREMIUM_THEMES_PATH' ) ||
	! defined( 'WPCOMSH_STOREFRONT_THEMES_PATH' ) ||
	! defined( 'WPCOMSH_STOREFRONT_PATH' ) ||

	// Paths to the location of WP.com pub/premium and storefront themes.
	// Used for symlinking the themes to wp-content/themes dir.
	! defined( 'WPCOMSH_PUB_THEMES_SYMLINK' ) ||
	! defined( 'WPCOMSH_PREMIUM_THEMES_SYMLINK' ) ||
	! defined( 'WPCOMSH_STOREFRONT_THEMES_SYMLINK' ) ||
	! defined( 'WPCOMSH_STOREFRONT_SYMLINK' )
) {
	// This won't work. Just a fallback so functions in this plugin return false instead of warning/error.
	define( 'WPCOMSH_PUB_THEMES_PATH', $current_dir );
	define( 'WPCOMSH_PREMIUM_THEMES_PATH', $current_dir );
	define( 'WPCOMSH_STOREFRONT_THEMES_PATH', $current_dir );
	define( 'WPCOMSH_STOREFRONT_PATH', $current_dir );

	define( 'WPCOMSH_PUB_THEMES_SYMLINK', $current_dir );
	define( 'WPCOMSH_PREMIUM_THEMES_SYMLINK', $current_dir );
	define( 'WPCOMSH_STOREFRONT_THEMES_SYMLINK', $current_dir );
	define( 'WPCOMSH_STOREFRONT_SYMLINK', $current_dir );
}

define( 'WPCOMSH_PUB_THEME_TYPE', 'wpcom_pub_theme_type' );
define( 'WPCOMSH_PREMIUM_THEME_TYPE', 'wpcom_premium_theme_type' );
define( 'WPCOMSH_STOREFRONT_THEME_TYPE', 'wpcom_storefront_theme_type' );
define( 'WPCOMSH_NON_WPCOM_THEME', 'non_wpcom_theme' );

define( 'WPCOMSH_PLAN_FREE', 'free' );
define( 'WPCOMSH_PLAN_PREMIUM', 'premium' );
define( 'WPCOMSH_PLAN_BUSINESS', 'business' );
