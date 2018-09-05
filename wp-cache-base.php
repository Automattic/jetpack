<?php
global $WPSC_HTTP_HOST, $cache_enabled, $cache_path, $blogcacheid, $blog_cache_dir;

if ( ! empty( $_SERVER['HTTP_HOST'] ) ) {
	$WPSC_HTTP_HOST = function_exists( 'mb_strtolower' ) ? mb_strtolower( $_SERVER['HTTP_HOST'] ) : strtolower( $_SERVER['HTTP_HOST'] );
	$WPSC_HTTP_HOST = htmlentities( $WPSC_HTTP_HOST );
} elseif ( PHP_SAPI === 'cli' && function_exists( 'get_option' ) ) {
	$WPSC_HTTP_HOST = (string) parse_url( get_option( 'home' ), PHP_URL_HOST );
} else {
	$cache_enabled  = false;
	$WPSC_HTTP_HOST = '';
}

// We want to be able to identify each blog in a WordPress MU install
$blogcacheid    = '';
$blog_cache_dir = $cache_path;

if ( is_multisite() ) {
	global $current_blog;

	if ( is_object( $current_blog ) && function_exists( 'is_subdomain_install' ) ) {
		$blogcacheid = is_subdomain_install() ? $current_blog->domain : trim( $current_blog->path, '/' );
	} elseif ( ( defined( 'SUBDOMAIN_INSTALL' ) && SUBDOMAIN_INSTALL ) || ( defined( 'VHOST' ) && VHOST === 'yes' ) ) {
		$blogcacheid = $WPSC_HTTP_HOST;
	} else {
		$request_uri = str_replace( '..', '', preg_replace( '/[ <>\'\"\r\n\t\(\)]/', '', $_SERVER['REQUEST_URI'] ) );
		$request_uri = str_replace( '//', '/', $request_uri );

		$wpsc_path_segs  = array_filter( explode( '/', trim( $request_uri, '/' ) ) );
		$wpsc_base_count = defined( 'PATH_CURRENT_SITE' ) ? count( array_filter( explode( '/', trim( PATH_CURRENT_SITE, '/' ) ) ) ) : 0;
		if ( '/' !== substr( $request_uri, -1 ) ) {
			$wpsc_path_segs = array_slice( $wpsc_path_segs, 0, -1 );
		}

		if ( count( $wpsc_path_segs ) > $wpsc_base_count &&
			( ! defined( 'PATH_CURRENT_SITE' ) || 0 === strpos( $request_uri, PATH_CURRENT_SITE ) )
		) {
			$blogcacheid = $wpsc_path_segs[ $wpsc_base_count ];
		}
	}

	// If blogcacheid is empty then set it to main blog.
	if ( empty( $blogcacheid ) ) {
		$blogcacheid = 'blog';
	}
	$blog_cache_dir = str_replace( '//', '/', $cache_path . 'blogs/' . $blogcacheid . '/' );
}
