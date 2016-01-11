<?php
/**
 * Module Name: Sitemaps
 * Module Description: Creates sitemaps to allow your site to be easily indexed by search engines.
 * Sort Order: 13
 * First Introduced: 3.9
 * Requires Connection: No
 * Auto Activate: Public
 * Module Tags: Recommended, Traffic
 * Additional Search Queries: sitemap, traffic, search, site map, seo
 */

/**
 * Check site privacy before activating sitemaps.
 *
 * @module sitemaps
 */
function jetpack_sitemaps_activate() {
	Jetpack::check_privacy( __FILE__ );
}

add_action( 'jetpack_activate_module_sitemaps', 'jetpack_sitemaps_activate' );

if ( '1' == get_option( 'blog_public' ) ) {
	include_once 'sitemaps/sitemaps.php';
}