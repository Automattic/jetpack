<?php
/*
WP-Cache Config Sample File

See wp-cache.php for author details.
*/

define( 'WPCACHEHOME', WP_CONTENT_DIR . '/plugins/wp-super-cache/' );

$cache_compression = 0; // Super cache compression
$cache_enabled = false;
$super_cache_enabled = false;
$cache_max_time = 3600; //in seconds
//$use_flock = true; // Set it true or false if you know what to use
$super_cache_max_time = 21600; // in seconds
$cache_path = WP_CONTENT_DIR . '/cache/';
$file_prefix = 'wp-cache-';

// We want to be able to identify each blog in a WordPress MU install
$blogcacheid = '';
if( defined( 'VHOST' ) ) {
	$blogcacheid = 'blog'; // main blog
	if( constant( 'VHOST' ) == 'yes' ) {
		$blogcacheid = $_SERVER['HTTP_HOST'];
	} else {
		$request_uri = preg_replace('/[ <>\'\"\r\n\t\(\)]/', '', str_replace( '..', '', $_SERVER['REQUEST_URI'] ) );
		if( strpos( $request_uri, '/', 1 ) ) {
			if( $base == '/' ) {
				$blogcacheid = substr( $request_uri, 1, strpos( $request_uri, '/', 1 ) - 1 );
			} else {
				$blogcacheid = str_replace( $base, '', $request_uri );
				$blogcacheid = substr( $blogcacheid, 0, strpos( $blogcacheid, '/', 1 ) );
			}
			if ( '/' == substr($blogcacheid, -1))
				$blogcacheid = substr($blogcacheid, 0, -1);
		}
	}
}

// Array of files that have 'wp-' but should still be cached 
$cache_acceptable_files = array( 'wp-comments-popup.php', 'wp-links-opml.php', 'wp-locations.php' );

$cache_rejected_uri = array('wp-.*.php', 'index.php');
$cache_rejected_user_agent = array ( 0 => 'bot', 1 => 'ia_archive', 2 => 'slurp', 3 => 'crawl', 4 => 'spider');

// Just modify it if you have conflicts with semaphores
$sem_id = 5419;

if ( '/' != substr($cache_path, -1)) {
	$cache_path .= '/';
}

?>
