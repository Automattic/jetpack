<?php
/**
 * Module Name: Sitemaps
 * Module Description: Make it easy for search engines to find your site.
 * Sort Order: 13
 * First Introduced: 3.9
 * Requires Connection: No
 * Auto Activate: Public
 * Module Tags: Recommended, Traffic
 * Additional Search Queries: sitemap, traffic, search, site map, seo
 */

/**
 * Disable direct access and execution.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( '1' == get_option( 'blog_public' ) ) {
	include_once 'sitemaps/sitemaps.php';
}

add_action( 'jetpack_activate_module_sitemaps', 'jetpack_sitemap_on_activate' );

/**
 * Run when Sitemaps module is activated.
 *
 * @since 4.8.0
 */
function jetpack_sitemap_on_activate() {
	require_once dirname( __FILE__ ) . '/sitemaps/sitemap-constants.php';
	require_once dirname( __FILE__ ) . '/sitemaps/sitemap-buffer.php';
	require_once dirname( __FILE__ ) . '/sitemaps/sitemap-stylist.php';
	require_once dirname( __FILE__ ) . '/sitemaps/sitemap-librarian.php';
	require_once dirname( __FILE__ ) . '/sitemaps/sitemap-finder.php';
	require_once dirname( __FILE__ ) . '/sitemaps/sitemap-builder.php';

	wp_clear_scheduled_hook( 'jp_sitemap_cron_hook' );
	wp_clear_scheduled_hook( 'jetpack_sitemap_generate_on_activate' );

	$sitemap_builder = new Jetpack_Sitemap_Builder();
	add_action( 'jetpack_sitemap_generate_on_activate', array( $sitemap_builder, 'update_sitemap' ) );

	wp_schedule_single_event( time() + 60, 'jetpack_sitemap_generate_on_activate' );
}
