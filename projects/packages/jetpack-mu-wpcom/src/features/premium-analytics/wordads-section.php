<?php
/**
 * The Ads section of the Premium Analytics dashboard on the WordPress.com platform.
 *
 * Simple runs no Jetpack plugin, and on Atomic the WordAds module is routinely off while the plan
 * includes WordAds, so the plan feature decides here and the module registrant skips the platform.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Register the Ads section on a site whose plan includes WordAds and that has WordAds on, unless
 * another owner already holds the `ads` slug: an older dashboard package still registering the section itself.
 *
 * @since $$next-version$$
 *
 * @param \Automattic\Jetpack\PremiumAnalytics\Dashboard_Section_Registry $registry The registry being hydrated.
 * @return void
 */
function wpcom_premium_analytics_register_wordads_section( $registry ) {
	if ( ! function_exists( 'wpcom_site_has_feature' ) || ! wpcom_site_has_feature( 'wordads' ) ) {
		return;
	}

	// Classic Stats shows its Ads tab only while WordAds is on, not to every plan that could use it.
	if ( ! wpcom_premium_analytics_wordads_is_enabled() ) {
		return;
	}

	$dashboard_name = \Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

	if ( wpcom_premium_analytics_dashboard_has_section_slug( $registry, $dashboard_name, 'ads' ) ) {
		return;
	}

	\Automattic\Jetpack\PremiumAnalytics\register_dashboard_section(
		$dashboard_name,
		'wordads/ads',
		array(
			'label'               => __( 'Ads', 'jetpack-mu-wpcom' ),
			'title'               => __( 'Ads performance', 'jetpack-mu-wpcom' ),
			'order'               => 50,
			'is_available'        => array( \Automattic\Jetpack\PremiumAnalytics\Capabilities::class, 'current_user_can_view_ad_reports' ),
			// Only the chart supports dates, so it owns the control. No Ads widget
			// supports comparison.
			'date_filter_options' => array(
				'with_date_comparison'     => false,
				'with_header_date_control' => false,
			),
			'default_layout'      => 'Automattic\\Jetpack\\PremiumAnalytics\\get_ads_section_default_layout',
		)
	);
}

/**
 * Whether the site is using WordAds: the answer classic Stats reads as the sites API's
 * `options.wordads`, so both dashboards show the Ads tab to the same sites.
 *
 * @since $$next-version$$
 *
 * @return bool
 */
function wpcom_premium_analytics_wordads_is_enabled() {
	if ( ( new \Automattic\Jetpack\Status\Host() )->is_wpcom_simple() ) {
		// Simple keeps its own WordAds record. Until the wpcom function behind the
		// SAL's has_wordads() is wired here, the plan feature alone decides, as before.
		// TODO WOOA7S-2208: call that function.
		return ! function_exists( 'wpcom_wordads_is_enabled' ) || (bool) wpcom_wordads_is_enabled();
	}

	// Atomic runs the Jetpack plugin, where classic reads the WordAds module. Not
	// `available_only`: the module list is not loaded on every request that hydrates the registry.
	return ( new \Automattic\Jetpack\Modules() )->is_active( 'wordads', false );
}

/**
 * Whether a section with the slug is registered on the dashboard.
 *
 * Reads the registry through the slug lookup when the package offers it, and through the full
 * list otherwise: the package and this file ship on different cadences.
 *
 * @since $$next-version$$
 *
 * @param object $registry       The registry being hydrated.
 * @param string $dashboard_name Dashboard identifier.
 * @param string $slug           Section slug.
 * @return bool
 */
function wpcom_premium_analytics_dashboard_has_section_slug( $registry, $dashboard_name, $slug ) {
	if ( method_exists( $registry, 'get_registered_by_slug' ) ) {
		return null !== $registry->get_registered_by_slug( $dashboard_name, $slug );
	}

	foreach ( $registry->get_all_registered( $dashboard_name ) as $section ) {
		if ( $section->slug === $slug ) {
			return true;
		}
	}

	return false;
}

// After the package's own sections (priority 10), so an existing `ads` slug is found and left alone.
add_action( 'jetpack_premium_analytics_register_dashboard_sections', 'wpcom_premium_analytics_register_wordads_section', 20 );
