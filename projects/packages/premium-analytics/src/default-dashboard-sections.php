<?php
/**
 * The package's own dashboard sections: the built-in tabs, their availability gates, and the
 * filters over those gates. They register through the section API in dashboard-sections.php,
 * the same way a plugin extending the dashboard would.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;

// Guarded on a symbol the file declares, so a second copy of the package can't
// redeclare it. See the include block in Analytics::load_dashboard_components().
if ( ! function_exists( __NAMESPACE__ . '\\register_dashboard_section' ) ) {
	require_once __DIR__ . '/dashboard-sections.php';
}

/**
 * Filter through which WooCommerce section availability is resolved.
 */
const WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER = 'jetpack_premium_analytics_woocommerce_dashboard_section_available';

/**
 * Filter through which Subscribers section availability is resolved.
 */
const SUBSCRIBERS_DASHBOARD_SECTION_AVAILABLE_FILTER = 'jetpack_premium_analytics_subscribers_dashboard_section_available';

/**
 * Filter for Ads section availability.
 */
const ADS_DASHBOARD_SECTION_AVAILABLE_FILTER = 'jetpack_premium_analytics_ads_dashboard_section_available';

/**
 * Whether the WooCommerce dashboard section should be exposed.
 *
 * @return bool True when WooCommerce is active.
 */
function is_woocommerce_dashboard_section_available() {
	$is_available = class_exists( 'WooCommerce' ) || function_exists( 'WC' );

	/**
	 * Filters whether the WooCommerce dashboard section is available.
	 *
	 * @param bool $is_available Whether WooCommerce was detected in the current request.
	 */
	return (bool) apply_filters( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, $is_available );
}

/**
 * Whether the current user should be shown the WooCommerce dashboard section.
 *
 * The sibling is_woocommerce_dashboard_section_available() answers "is
 * WooCommerce here"; this adds "and may this reader see store data".
 *
 * @since 0.1.0
 *
 * @return bool
 */
function is_woocommerce_dashboard_section_available_to_current_user() {
	return is_woocommerce_dashboard_section_available() && Capabilities::current_user_can_view_store_reports();
}

/**
 * Whether the Subscribers dashboard section should be exposed.
 *
 * Sites without Jetpack have no module state to check, so the section remains
 * available. Modules::is_active() also returns true on WPCOM Simple.
 *
 * @since 0.3.0
 *
 * @return bool True when the subscriptions module is active.
 */
function is_subscribers_dashboard_section_available() {
	$is_available = ! class_exists( 'Jetpack' ) || ( new Modules() )->is_active( 'subscriptions' );

	/**
	 * Filters whether the Subscribers dashboard section is available.
	 *
	 * @since 0.3.0
	 *
	 * @param bool $is_available Whether the subscriptions module was detected in the current request.
	 */
	return (bool) apply_filters( SUBSCRIBERS_DASHBOARD_SECTION_AVAILABLE_FILTER, $is_available );
}

/**
 * Whether the Ads dashboard section is available.
 *
 * WPCOM reads the plan feature rather than the module, which is a false negative
 * on Atomic and meaningless on Simple. Mirrors is_videopress_available().
 *
 * @since 0.4.0
 *
 * @return bool True when the site can produce WordAds earnings.
 */
function is_ads_dashboard_section_available() {
	if ( ( new Host() )->is_wpcom_platform() ) {
		$is_available = function_exists( 'wpcom_site_has_feature' ) && \wpcom_site_has_feature( 'wordads' );
	} else {
		$is_available = ! class_exists( 'Jetpack' ) || ( new Modules() )->is_active( 'wordads' );
	}

	/**
	 * Filters whether the Ads dashboard section is available.
	 *
	 * @since 0.4.0
	 *
	 * @param bool $is_available Whether WordAds was detected in the current request.
	 */
	return (bool) apply_filters( ADS_DASHBOARD_SECTION_AVAILABLE_FILTER, $is_available );
}

/**
 * Whether the current user can access the Ads dashboard section.
 *
 * @since 0.4.0
 *
 * @return bool
 */
function is_ads_dashboard_section_available_to_current_user() {
	return is_ads_dashboard_section_available() && Capabilities::current_user_can_view_ad_reports();
}

/**
 * Returns the default widget layout for the WooCommerce dashboard section.
 *
 * @return array Array of widget instances.
 */
function get_woocommerce_dashboard_section_default_layout() {
	return get_dashboard_default_layout_for( 'woocommerce/store' );
}

/**
 * Registers the default Premium Analytics dashboard sections.
 *
 * @return void
 */
function register_default_dashboard_sections() {
	$registry = Dashboard_Section_Registry::get_instance();

	$sections = array(
		'analytics/traffic'     => array(
			'label'          => __( 'Traffic', 'jetpack-premium-analytics-pkg' ),
			'title'          => __( 'Site traffic', 'jetpack-premium-analytics-pkg' ),
			'order'          => 10,
			'default_layout' => static function () {
				return get_dashboard_default_layout_for( 'analytics/traffic' );
			},
		),
		'analytics/insights'    => array(
			'label'               => __( 'Insights', 'jetpack-premium-analytics-pkg' ),
			'title'               => __( 'Site insights', 'jetpack-premium-analytics-pkg' ),
			'order'               => 20,
			// Insights reads whole history: all time and single years, with nothing
			// to compare them against. Most widgets have fixed periods of their own,
			// so no header control; Highlights hosts the only year control.
			'date_filter'         => Dashboard_Section::DATE_FILTER_YEAR,
			'date_filter_options' => array(
				'with_date_comparison'     => false,
				'with_header_date_control' => false,
			),
			'default_layout'      => static function () {
				return get_dashboard_default_layout_for( 'analytics/insights' );
			},
		),
		'analytics/subscribers' => array(
			'label'          => __( 'Subscribers', 'jetpack-premium-analytics-pkg' ),
			'title'          => __( 'Subscribers stats', 'jetpack-premium-analytics-pkg' ),
			'order'          => 30,
			'is_available'   => __NAMESPACE__ . '\\is_subscribers_dashboard_section_available',
			'default_layout' => static function () {
				return get_dashboard_default_layout_for( 'analytics/subscribers' );
			},
		),
		// Store registers no heading of its own, so it falls back to the label.
		'woocommerce/store'     => array(
			'label'          => __( 'Store', 'jetpack-premium-analytics-pkg' ),
			'order'          => 40,
			'is_available'   => __NAMESPACE__ . '\\is_woocommerce_dashboard_section_available_to_current_user',
			// Nothing backfills historical orders to WordPress.com but the analytics
			// full sync. The site sections above read data it already holds.
			'requires_sync'  => true,
			'default_layout' => __NAMESPACE__ . '\\get_woocommerce_dashboard_section_default_layout',
		),
		'analytics/ads'         => array(
			'label'               => __( 'Ads', 'jetpack-premium-analytics-pkg' ),
			'order'               => 50,
			'is_available'        => __NAMESPACE__ . '\\is_ads_dashboard_section_available_to_current_user',
			// Only the chart supports dates, so it owns the control. No Ads widget
			// supports comparison.
			'date_filter_options' => array(
				'with_date_comparison'     => false,
				'with_header_date_control' => false,
			),
			'default_layout'      => static function () {
				return get_dashboard_default_layout_for( 'analytics/ads' );
			},
		),
	);

	foreach ( $sections as $id => $args ) {
		if ( ! $registry->is_registered( DASHBOARD_NAME, $id ) ) {
			register_dashboard_section( DASHBOARD_NAME, $id, $args );
		}
	}
}

/**
 * Hydrates the dashboard section registry with the package's own sections.
 *
 * @return void
 */
function bootstrap_dashboard_sections() {
	if ( did_action( 'init' ) ) {
		register_default_dashboard_sections();
	} else {
		add_action( 'init', __NAMESPACE__ . '\\register_default_dashboard_sections' );
	}
}

bootstrap_dashboard_sections();
