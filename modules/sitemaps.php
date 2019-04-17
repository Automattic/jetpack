<?php
/**
 * Module Name: Sitemaps
 * Module Description: Make it easy for search engines to find your site.
 * Sort Order: 13
 * First Introduced: 3.9
 * Requires Connection: No
 * Auto Activate: Public
 * Module Tags: Recommended, Traffic
 * Feature: Recommended
 * Additional Search Queries: sitemap, traffic, search, site map, seo
 *
 * @package Jetpack
 */

/**
 * Disable direct access and execution.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( '1' == get_option( 'blog_public' ) ) { // loose comparison okay.
	include_once 'sitemaps/sitemaps.php';
}

add_action( 'jetpack_activate_module_sitemaps', 'jetpack_sitemap_on_activate' );

/**
 * Run when Sitemaps module is activated.
 *
 * @since 4.8.0
 */
function jetpack_sitemap_on_activate() {
	wp_clear_scheduled_hook( 'jp_sitemap_cron_hook' );
	require_once dirname( __FILE__ ) . '/sitemaps/sitemap-constants.php';
	require_once dirname( __FILE__ ) . '/sitemaps/sitemap-buffer.php';
	require_once dirname( __FILE__ ) . '/sitemaps/sitemap-stylist.php';
	require_once dirname( __FILE__ ) . '/sitemaps/sitemap-librarian.php';
	require_once dirname( __FILE__ ) . '/sitemaps/sitemap-finder.php';
	require_once dirname( __FILE__ ) . '/sitemaps/sitemap-builder.php';
}
