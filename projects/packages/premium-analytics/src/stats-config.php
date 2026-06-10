<?php
/**
 * Stats data config: expose the connected site's blog id to the dashboard page.
 *
 * The stats-admin proxy routes (`jetpack/v4/stats-app/sites/{blogId}/stats/...`)
 * bake the WordPress.com blog id into the path, so stats widgets need that id on
 * the client to build their requests. This exposes it as
 * `window.configData.blog_id` (the Odyssey convention the widgets read) by
 * attaching an inline script to `wp-api-fetch`, which the page already enqueues
 * for its REST preloading middleware.
 *
 * NOTE: bridge wiring. This is expected to be subsumed by the Premium Analytics
 * data package once it lands; see `widgets/locations/README.md`.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Expose the connected blog id to the dashboard page as
 * `window.configData.blog_id`.
 *
 * Hooked to the page render's init actions, which only fire while the Premium
 * Analytics page is rendering, so this is inherently page-scoped. No-ops when
 * the connection isn't available (no `Jetpack_Options`) or the site isn't
 * connected (no blog id).
 *
 * @return void
 */
function expose_blog_id_to_dashboard() {
	if ( ! class_exists( '\Jetpack_Options' ) ) {
		return;
	}

	$blog_id = \Jetpack_Options::get_option( 'id' );
	if ( ! $blog_id ) {
		return;
	}

	wp_add_inline_script(
		'wp-api-fetch',
		'window.configData = window.configData || {}; window.configData.blog_id = ' . (int) $blog_id . ';',
		'before'
	);
}
// The full-page interceptor (page.php) fires `{page-id}_init`; the in-admin
// variant (page-wp-admin.php) fires `{page-id}-wp-admin_init`. Hook both so the
// blog id is exposed regardless of which renders.
add_action( 'jetpack-premium-analytics_init', __NAMESPACE__ . '\\expose_blog_id_to_dashboard' );
add_action( 'jetpack-premium-analytics-wp-admin_init', __NAMESPACE__ . '\\expose_blog_id_to_dashboard' );
