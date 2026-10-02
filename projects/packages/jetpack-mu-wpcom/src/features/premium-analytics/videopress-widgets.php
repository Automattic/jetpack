<?php
/**
 * The Top videos widget of the Premium Analytics dashboard on the WordPress.com platform.
 *
 * Simple runs no Jetpack plugin, and on Atomic the VideoPress module is routinely off while the plan
 * includes VideoPress, so the plan feature decides here and the package registrant skips the platform.
 * The widget comes from the jetpack-videopress package, which the Jetpack plugin bundles: WordPress.com
 * loads that copy, so this package does not.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\VideoPress\Analytics_Dashboard;

/**
 * Whether the site's plan includes VideoPress, and the package that owns the widget is here.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function wpcom_premium_analytics_site_has_videopress() {
	return function_exists( 'wpcom_site_has_feature' )
		&& wpcom_site_has_feature( 'videopress' )
		&& class_exists( Analytics_Dashboard::class );
}

/**
 * Register the Top videos widget type on a site whose plan includes VideoPress.
 *
 * @since $$next-version$$
 *
 * @param \Automattic\Jetpack\PremiumAnalytics\Widget_Type_Registry $registry The registry being hydrated.
 * @return void
 */
function wpcom_premium_analytics_register_videopress_widget_types( $registry ) {
	if ( ! wpcom_premium_analytics_site_has_videopress() ) {
		return;
	}

	Analytics_Dashboard::register_widget_types( $registry );
}

/**
 * Seed the Top videos instance into the Traffic default layout on a site whose plan includes VideoPress.
 *
 * @since $$next-version$$
 *
 * @param array  $layout     The section's default widget instances.
 * @param string $section_id Namespaced section identifier.
 * @return array
 */
function wpcom_premium_analytics_seed_videopress_default_layout( $layout, $section_id ) {
	if ( ! wpcom_premium_analytics_site_has_videopress() ) {
		return $layout;
	}

	return Analytics_Dashboard::add_default_layout_instance( $layout, $section_id );
}

// After the package's own registrant (priority 10); the seed runs before the dashboard's policy at 100.
add_action( 'jetpack_premium_analytics_register_widget_types', 'wpcom_premium_analytics_register_videopress_widget_types', 20 );
add_filter( 'jetpack_premium_analytics_dashboard_default_layout', 'wpcom_premium_analytics_seed_videopress_default_layout', 10, 2 );
