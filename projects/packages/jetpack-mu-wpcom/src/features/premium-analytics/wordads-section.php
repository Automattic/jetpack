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
 * Register the Ads section on a site whose plan includes WordAds, unless another owner already
 * holds the `ads` slug: an older dashboard package still registering the section itself.
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

	$dashboard_name = \Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

	if ( wpcom_premium_analytics_dashboard_has_section_slug( $registry, $dashboard_name, 'ads' ) ) {
		return;
	}

	$registry->register(
		$dashboard_name,
		'wordads/ads',
		array(
			'label'               => __( 'Ads', 'jetpack-mu-wpcom' ),
			'order'               => 50,
			'is_available'        => array( \Automattic\Jetpack\PremiumAnalytics\Capabilities::class, 'current_user_can_view_ad_reports' ),
			// Only the chart supports dates, so it owns the control. No Ads widget
			// supports comparison.
			'date_filter_options' => array(
				'with_date_comparison'     => false,
				'with_header_date_control' => false,
			),
			'default_layout'      => 'wpcom_premium_analytics_get_wordads_section_default_layout',
		)
	);
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

/**
 * The tab's default widget layout: the package's WordAds widgets on the three-column grid.
 *
 * @return array Widget instances.
 */
function wpcom_premium_analytics_get_wordads_section_default_layout() {
	$instance = 'Automattic\Jetpack\PremiumAnalytics\get_dashboard_default_widget_instance';

	return array(
		// Row 1: WordAds chart.
		$instance( 'default-wordads-chart-tabs-widget-instance', 'jpa/wordads-chart-tabs', 0, 3, 2 ),
		// Row 2: all-time balance.
		$instance( 'default-wordads-highlights-widget-instance', 'jpa/wordads-highlights', 1, 3, 1 ),
		// Row 3: earnings history.
		$instance( 'default-wordads-earnings-history-widget-instance', 'jpa/wordads-earnings-history', 2, 1, 2 ),
	);
}

// After the package's own sections (priority 10), so an existing `ads` slug is found and left alone.
add_action( 'jetpack_premium_analytics_register_dashboard_sections', 'wpcom_premium_analytics_register_wordads_section', 20 );
