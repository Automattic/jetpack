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
 * Additional Search Queries: search engine optimization, social preview, meta description, custom title format
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once __DIR__ . '/seo-tools/class-jetpack-seo-utils.php';

// Suppress SEO Tools output at runtime when a conflicting plugin is active.
if ( ! empty( Jetpack_SEO_Utils::get_active_conflicting_plugins() ) ) {
	add_filter( 'jetpack_disable_seo_tools', '__return_true' );
	add_filter( 'jetpack_seo_meta_tags_enabled', '__return_false' );
}

// JETH-10045: when a conflicting plugin is activated, deactivate the
// seo-tools module and surface a one-time admin notice.
add_action( 'activated_plugin', array( 'Jetpack_SEO_Utils', 'auto_disable_on_conflict' ), 10, 2 );

add_action(
	'admin_notices',
	static function () {
		$slug = get_transient( 'jetpack_seo_conflict_notice' );
		if ( ! $slug || ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$plugins = wp_list_pluck( Jetpack_SEO_Utils::get_conflicting_seo_plugins(), 'name', 'slug' );
		$name    = $plugins[ $slug ] ?? $slug;
		printf(
			'<div class="notice notice-info is-dismissible"><p>%s</p></div>',
			esc_html(
				sprintf(
					/* translators: %s: name of the SEO plugin that was activated */
					__( 'Jetpack SEO was deactivated automatically because %s was activated.', 'jetpack' ),
					$name
				)
			)
		);
		delete_transient( 'jetpack_seo_conflict_notice' );
	}
);

/** This filter is documented in modules/seo-tools/class-jetpack-seo-utils.php */
if ( ! apply_filters( 'jetpack_disable_seo_tools', false ) ) {
	require_once __DIR__ . '/seo-tools/class-jetpack-seo.php';
	require_once __DIR__ . '/seo-tools/class-jetpack-seo-admin-columns.php';
	new Jetpack_SEO();
	Jetpack_SEO_Admin_Columns::init();
}
