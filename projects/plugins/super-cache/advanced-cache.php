<?php
// WP SUPER CACHE 1.2
function wpcache_broken_message() {
	global $wp_cache_config_file;
	if ( isset( $wp_cache_config_file ) == false ) {
		return '';
	}

	$doing_ajax     = defined( 'DOING_AJAX' ) && DOING_AJAX;
	$xmlrpc_request = defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST;
	$rest_request   = defined( 'REST_REQUEST' ) && REST_REQUEST;
	$robots_request = strpos( $_SERVER['REQUEST_URI'], 'robots.txt' ) != false;

	$skip_output = ( $doing_ajax || $xmlrpc_request || $rest_request || $robots_request );
	if ( false == strpos( $_SERVER['REQUEST_URI'], 'wp-admin' ) && ! $skip_output ) {
		echo '<!-- WP Super Cache is installed but broken. The constant WPCACHEHOME must be set in the file wp-config.php and point at the WP Super Cache plugin directory. -->';
	}
}

if ( false == defined( 'WPCACHEHOME' ) ) {
	define( 'ADVANCEDCACHEPROBLEM', 1 );
} elseif ( ! include_once WPCACHEHOME . 'wp-cache-phase1.php' ) {
	if ( ! @is_file( WPCACHEHOME . 'wp-cache-phase1.php' ) ) {
		define( 'ADVANCEDCACHEPROBLEM', 1 );
	}
}
if ( defined( 'ADVANCEDCACHEPROBLEM' ) ) {
	register_shutdown_function( 'wpcache_broken_message' );
}
