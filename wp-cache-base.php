<?php
if ( false == isset( $_SERVER[ 'HTTP_HOST' ] ) ) {
	$cache_enabled = false;
	$WPSC_HTTP_HOST = '';
} else {
	$WPSC_HTTP_HOST = htmlentities( $_SERVER[ 'HTTP_HOST' ] );
}

// We want to be able to identify each blog in a WordPress MU install
$blogcacheid = '';
if ( ( defined( 'WP_ALLOW_MULTISITE' ) && constant( 'WP_ALLOW_MULTISITE' ) == true ) || defined( 'SUBDOMAIN_INSTALL' ) || defined( 'VHOST' ) || defined( 'SUNRISE' ) ) {
	$blogcacheid = 'blog'; // main blog
	if( defined( 'SUBDOMAIN_INSTALL' ) && constant( 'SUBDOMAIN_INSTALL' ) == true ) {
		$blogcacheid = $WPSC_HTTP_HOST;
	} else {
		if ( isset( $base ) == false )
			$base = '';
		$request_uri = str_replace( '..', '', preg_replace('/[ <>\'\"\r\n\t\(\)]/', '', $_SERVER['REQUEST_URI'] ) );
		if( strpos( $request_uri, '/', 1 ) ) {
			if( $base == '/' ) {
				$blogcacheid = substr( $request_uri, 1, strpos( $request_uri, '/', 1 ) - 1 );
			} else {
				$blogcacheid = str_replace( $base, '', $request_uri );
				if ( $blogcacheid != '' )
					$blogcacheid = substr( $blogcacheid, 0, strpos( $blogcacheid, '/', 1 ) );
			}
			if ( '/' == substr($blogcacheid, -1))
				$blogcacheid = substr($blogcacheid, 0, -1);
		}
		$blogcacheid = str_replace( '/', '', $blogcacheid );
	}
}

?>
