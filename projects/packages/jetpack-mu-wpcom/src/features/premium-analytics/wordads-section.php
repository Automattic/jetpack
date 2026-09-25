<?php
/**
 * The Ads section of the Premium Analytics dashboard on the WordPress.com platform.
 *
 * Simple runs no Jetpack plugin, and on Atomic the WordAds module is routinely off while the plan
 * includes WordAds, so the plan feature decides here and the module registrant skips the platform.
 * The section, its layout and the widgets come from the jetpack-wordads-analytics package, which
 * the Jetpack plugin bundles: WordPress.com loads that copy, so this package does not.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\WordAds\Analytics_Dashboard;

/**
 * Whether the site's plan includes WordAds, and the package that owns the section is here.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function wpcom_premium_analytics_site_has_wordads() {
	return function_exists( 'wpcom_site_has_feature' )
		&& wpcom_site_has_feature( 'wordads' )
		&& class_exists( Analytics_Dashboard::class );
}

/**
 * Register the Ads section on a site whose plan includes WordAds.
 *
 * @since $$next-version$$
 *
 * @param \Automattic\Jetpack\PremiumAnalytics\Dashboard_Section_Registry $registry The registry being hydrated.
 * @return void
 */
function wpcom_premium_analytics_register_wordads_section( $registry ) {
	if ( ! wpcom_premium_analytics_site_has_wordads() ) {
		return;
	}

	Analytics_Dashboard::register_section( $registry );
}

/**
 * Register the Ads widget types on a site whose plan includes WordAds.
 *
 * @since $$next-version$$
 *
 * @param \Automattic\Jetpack\PremiumAnalytics\Widget_Type_Registry $registry The registry being hydrated.
 * @return void
 */
function wpcom_premium_analytics_register_wordads_widget_types( $registry ) {
	if ( ! wpcom_premium_analytics_site_has_wordads() ) {
		return;
	}

	Analytics_Dashboard::register_widget_types( $registry );
}

// After the package's own registrants (priority 10), so an existing `ads` slug is found and left alone.
add_action( 'jetpack_premium_analytics_register_dashboard_sections', 'wpcom_premium_analytics_register_wordads_section', 20 );
add_action( 'jetpack_premium_analytics_register_widget_types', 'wpcom_premium_analytics_register_wordads_widget_types', 20 );
