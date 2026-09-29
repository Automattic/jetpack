<?php
/**
 * The Ads section of the Premium Analytics dashboard on the WordPress.com platform.
 *
 * Simple runs no Jetpack plugin, so the module registrant skips the platform and this file decides
 * for both: the plan must include WordAds, and the site must have it on (Atomic: the WordAds module;
 * Simple: the WordAds approval stickers), as classic Stats does.
 * The section, its layout and the widgets come from the jetpack-ads package, which
 * the Jetpack plugin bundles: WordPress.com loads that copy, so this package does not.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\WordAds\Analytics_Dashboard;

/**
 * Whether the site's plan includes WordAds, the site has it on, and the package that owns the
 * section is here.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function wpcom_premium_analytics_site_has_wordads() {
	return function_exists( 'wpcom_site_has_feature' )
		&& wpcom_site_has_feature( 'wordads' )
		&& wpcom_premium_analytics_wordads_is_enabled()
		&& class_exists( Analytics_Dashboard::class );
}

/**
 * Whether the site is using WordAds, read as classic Stats in wp-admin reads it: the
 * approval stickers on Simple, the WordAds module on Atomic. A plan that could use WordAds
 * is not a site that does.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function wpcom_premium_analytics_wordads_is_enabled() {
	if ( ( new Host() )->is_wpcom_simple() ) {
		// The stickers the sites API's has_wordads() reads on Simple.
		return function_exists( 'has_any_blog_stickers' )
			&& (bool) has_any_blog_stickers( array( 'wordads-approved', 'wordads-approved-misfits' ), get_current_blog_id() );
	}

	// Atomic runs the Jetpack plugin, where Odyssey Stats reads the WordAds module. Not
	// `available_only`: the module list is not loaded on every request that hydrates the registry.
	return ( new Modules() )->is_active( 'wordads', false );
}

/**
 * Register the Ads section on a site whose plan includes WordAds and that has it on.
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
 * Register the Ads widget types on a site whose plan includes WordAds and that has it on.
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
