<?php
# WP SUPER CACHE 0.8.9.1
function wpcache_broken_message() {
	if ( false == strpos( $_SERVER[ 'REQUEST_URI' ], 'wp-admin' ) )
		echo "<!-- WP Super Cache is installed but broken. The path to wp-cache-phase1.php in wp-content/advanced-cache.php must be fixed! -->";
}

if ( !include_once( 'CACHEHOME' . 'wp-cache-phase1.php' ) ) {
	if ( !@is_file( 'CACHEHOME' . 'wp-cache-phase1.php' ) ) {
		define( 'ADVANCEDCACHEPROBLEM', 1 );
		register_shutdown_function( 'wpcache_broken_message' );
	}
}
?>
