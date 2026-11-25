<?php
/**
 * Module Name: SEO
 * Module Description: Manage how your site appears in search engines, social previews, and AI tools from one page.
 * Sort Order: 35
 * First Introduced: 16.5-a.6
 * Requires Connection: No
 * Requires User Connection: No
 * Auto Activate: Yes
 * Module Tags: Traffic
 * Feature: Traffic
 * Additional Search Queries: seo, search engine optimization, sitemap, site verification, canonical urls, seo dashboard
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// A switch: the SEO package shows its page, and runs the SEO modules, while this is on.

// Switching SEO starts or stops Jetpack's sitemap, so cached sitemap and robots.txt responses go stale.
add_action( 'jetpack_activate_module_seo-dashboard', 'jetpack_seo_dashboard_queue_sitemap_purge' );
add_action( 'jetpack_deactivate_module_seo-dashboard', 'jetpack_seo_dashboard_purge_sitemap' );

/**
 * Purge the cached sitemap index while Sitemaps, about to pause, is still loaded.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function jetpack_seo_dashboard_purge_sitemap() {
	if ( class_exists( 'Jetpack_Sitemap_Manager', false ) ) {
		Jetpack_Sitemap_Manager::callback_invalidate_index_cache();
	}
}

/**
 * Have Sitemaps purge its cached index when it next loads, since it stays paused for this request.
 *
 * @since $$next-version$$
 *
 * @return void
 */
function jetpack_seo_dashboard_queue_sitemap_purge() {
	if ( Jetpack::is_module_active( 'sitemaps' ) && ! get_option( 'jetpack_sitemap_pending_cache_purge' ) ) {
		update_option( 'jetpack_sitemap_pending_cache_purge', 'urls', true );
	}
}
