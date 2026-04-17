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

	// Absorbed modules. These used to ship as standalone Jetpack modules
	// (Sitemaps, Site Verification, Canonical URLs). They now live inside
	// SEO Tools — their code still lives in modules/ sub-directories, but
	// there's no more standalone module entry file in modules/. Load is
	// gated by a matching option on the SEO Settings screen (except
	// verification, which is implicitly gated by the verification_services_codes
	// option — if no codes are set, nothing is emitted).

	// Site Verification — always loaded; `verification_services_codes` controls output.
	require_once __DIR__ . '/verification-tools/blog-verification-tools.php';

	// Sitemaps — gated on the `jetpack_seo_sitemap_enabled` option (default off
	// to preserve parity with the legacy "not activated" state).
	if ( get_option( 'jetpack_seo_sitemap_enabled', false ) && '1' === (string) get_option( 'blog_public' ) ) {
		require_once __DIR__ . '/sitemaps/sitemaps.php';
		add_filter( 'wp_sitemaps_enabled', '__return_false' );
	}

	// When the sitemap option flips from off → on, clear any stale cron and
	// reload the sitemap library so a fresh generation can kick off. Preserves
	// the behavior the legacy `jetpack_activate_module_sitemaps` action used to
	// provide when sitemaps was a standalone module.
	add_action(
		'update_option_jetpack_seo_sitemap_enabled',
		static function ( $old_value, $value ) {
			if ( ! $old_value && $value ) {
				jetpack_sitemap_on_activate();
			}
		},
		10,
		2
	);

	/**
	 * Run when the Sitemaps sub-feature is turned on from the SEO Settings
	 * screen. Previously hooked to `jetpack_activate_module_sitemaps`, which
	 * no longer fires since sitemaps has been absorbed into SEO Tools.
	 *
	 * @since 4.8.0
	 */
	function jetpack_sitemap_on_activate() {
		wp_clear_scheduled_hook( 'jp_sitemap_cron_hook' );
		require_once __DIR__ . '/sitemaps/sitemap-constants.php';
		require_once __DIR__ . '/sitemaps/sitemap-buffer.php';
		require_once __DIR__ . '/sitemaps/sitemap-stylist.php';
		require_once __DIR__ . '/sitemaps/sitemap-librarian.php';
		require_once __DIR__ . '/sitemaps/sitemap-finder.php';
		require_once __DIR__ . '/sitemaps/sitemap-builder.php';
	}

	// Canonical URLs — gated on `jetpack_seo_canonical_urls_enabled` (default ON;
	// it's a low-risk good-practice default).
	if ( get_option( 'jetpack_seo_canonical_urls_enabled', true ) ) {
		require_once __DIR__ . '/canonical-urls/canonical-urls.php';
	}
}
