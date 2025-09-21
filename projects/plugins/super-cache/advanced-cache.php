<?php
/**
 * WP SUPER CACHE advanced-cache.php
 *
 * Provides early load functionality for WP Super Cache.
 *
 * @package WP_Super_Cache
 * @since 1.2
 */

/**
 * Display a message if WP Super Cache is installed but broken.
 *
 * @return void
 */
function wpcache_broken_message() {
	global $wp_cache_config_file;

	if ( empty( $wp_cache_config_file ) ) {
		return;
	}

	$doing_ajax     = defined( 'DOING_AJAX' ) && DOING_AJAX;
	$xmlrpc_request = defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST;
	$rest_request   = defined( 'REST_REQUEST' ) && REST_REQUEST;

	$request_uri = isset( $_SERVER['REQUEST_URI'] )
		? sanitize_text_field( wp_unslash( $_SERVER['REQUEST_URI'] ) )
		: '';

	$robots_request = str_contains( $request_uri, 'robots.txt' );

	$skip_output = ( $doing_ajax || $xmlrpc_request || $rest_request || $robots_request );

	if ( ! str_contains( $request_uri, 'wp-admin' ) && ! $skip_output ) {
		echo '<!-- WP Super Cache is installed but broken. The constant WPCACHEHOME must be set in the file wp-config.php and point at the WP Super Cache plugin directory. -->';
	}
}

if ( ! defined( 'WPCACHEHOME' ) ) {
	define( 'ADVANCEDCACHEPROBLEM', 1 );
} elseif ( ! @include_once WPCACHEHOME . 'wp-cache-phase1.php' ) {
	if ( ! is_file( WPCACHEHOME . 'wp-cache-phase1.php' ) ) {
		define( 'ADVANCEDCACHEPROBLEM', 1 );
	}
}

if ( defined( 'ADVANCEDCACHEPROBLEM' ) ) {
	register_shutdown_function( 'wpcache_broken_message' );
}
