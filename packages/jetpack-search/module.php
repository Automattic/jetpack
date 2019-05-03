<?php

// TODO: inject this all as PHP stuff
/**
 * Module Name: Search
 * Module Description: Enhanced search, powered by Elasticsearch, a powerful replacement for WordPress search.
 * First Introduced: 5.0
 * Sort Order: 34
 * Free: false
 * Requires Connection: Yes
 * Auto Activate: No
 * Feature: Search
 * Additional Search Queries: search, elastic, elastic search, elasticsearch, fast search, search results, search performance, google search
 * Plans: business
 */

// bail if not running in WP
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_filter( 'jetpack_get_available_modules', function( $modules ) {
	$modules[ 'search' ] = 5.0;
	return $modules;
} );

add_filter( 'jetpack_get_module_path', function( $module, $path ) {
	if ( 'search' === $module ) {
		return dirname( __FILE__ ) . '/legacy/search.php';
	}
	return $path;
}, 10, 2 );