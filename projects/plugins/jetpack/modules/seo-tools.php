<?php
/**
 * Module Name: SEO Tools
 * Module Description: Optimize titles, meta descriptions, and social previews for better search results.
 * Sort Order: 35
 * Recommendation Order: 15
 * First Introduced: 4.4
 * Requires Connection: No
 * Requires User Connection: No
 * Auto Activate: No
 * Module Tags: Social, Appearance
 * Feature: Traffic
 * Additional Search Queries: search engine optimization, social preview, meta description, custom title format, seo, sitemap, open graph, search engine, title tag
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once __DIR__ . '/seo-tools/seo-tools-conflicts.php';

if ( jetpack_seo_has_conflicting_plugin() ) {
	// Also disable default meta tags.
	add_filter( 'jetpack_seo_meta_tags_enabled', '__return_false' );
}

// Preserve the general disable switch while deriving plugin conflicts from their own filter.
add_filter(
	'jetpack_disable_seo_tools',
	static function ( $disabled ) {
		return $disabled || jetpack_seo_has_conflicting_plugin();
	}
);

/** This filter is documented in modules/seo-tools/class-jetpack-seo-utils.php */
if ( ! apply_filters( 'jetpack_disable_seo_tools', false ) ) {
	require_once __DIR__ . '/seo-tools/class-jetpack-seo.php';
	new Jetpack_SEO();

	require_once __DIR__ . '/seo-tools/class-jetpack-seo-admin-columns.php';
	Jetpack_SEO_Admin_Columns::init();
}
