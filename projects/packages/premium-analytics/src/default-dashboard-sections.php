<?php
/**
 * The package's own dashboard sections: the built-in tabs, their availability gates and default
 * layouts, and the filters over those gates. They register through the section API in
 * dashboard-sections.php, the same way a plugin extending the dashboard would.
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
 * The Traffic tab's default widget layout.
 *
 * @return array Widget instances.
 */
function get_traffic_section_default_layout() {
	return array(
		// Rows fill the three-column grid in the prototype's order. Plan usage
		// is intentionally not a default; it stays available from the widget
		// picker.
		// Row 1: traffic chart.
		get_dashboard_default_widget_instance(
			'default-traffic-chart-widget-instance',
			'jpa/traffic-chart',
			0,
			3,
			2
		),
		// Row 2: most-viewed posts + referrers + devices.
		get_dashboard_default_widget_instance(
			'default-stats-top-posts-widget-instance',
			'jpa/stats-top-posts',
			1,
			1,
			2
		),
		get_dashboard_default_widget_instance(
			'default-referrers-widget-instance',
			'jpa/referrers',
			2,
			1,
			2
		),
		get_dashboard_default_widget_instance(
			'default-devices-widget-instance',
			'jpa/devices',
			3,
			1,
			2
		),
		// Row 3: locations map + top platforms.
		get_dashboard_default_widget_instance(
			'default-locations-widget-instance',
			'jpa/locations',
			4,
			2,
			2
		),
		get_dashboard_default_widget_instance(
			'default-top-platforms-widget-instance',
			'jpa/top-platforms',
			5,
			1,
			2
		),
		// Row 4: UTM insights + clicks + VideoPress (sites running VideoPress only).
		get_dashboard_default_widget_instance(
			'default-utm-insights-widget-instance',
			'jpa/utm-insights',
			6,
			1,
			2,
			array(
				'utmDimension' => 'utm_source,utm_medium',
			)
		),
		get_dashboard_default_widget_instance(
			'default-clicks-widget-instance',
			'jpa/clicks',
			7,
			1,
			2
		),
		get_dashboard_default_widget_instance(
			'default-videopress-widget-instance',
			'jpa/videopress',
			8,
			1,
			2
		),
		// Row 5: authors + search terms + file downloads (Simple only).
		get_dashboard_default_widget_instance(
			'default-authors-widget-instance',
			'jpa/authors',
			9,
			1,
			2
		),
		get_dashboard_default_widget_instance(
			'default-search-terms-widget-instance',
			'jpa/search-terms',
			10,
			1,
			2
		),
		get_dashboard_default_widget_instance(
			'default-file-downloads-widget-instance',
			'jpa/file-downloads',
			11,
			1,
			2
		),
	);
}

/**
 * The Insights tab's default widget layout.
 *
 * @return array Widget instances.
 */
function get_insights_section_default_layout() {
	return array(
		// Rows follow the design (WOOA7S-2009); Emails lives on the Subscribers tab.
		// Row 1: highlights banner.
		get_dashboard_default_widget_instance(
			'default-annual-highlights-widget-instance',
			'jpa/annual-highlights',
			0,
			3,
			1
		),
		// Row 2: at-a-glance cards. Two rows tall: their display-sized figures overflow a 200px tile.
		get_dashboard_default_widget_instance(
			'default-all-time-stats-widget-instance',
			'jpa/all-time-stats',
			1,
			1,
			2
		),
		get_dashboard_default_widget_instance(
			'default-most-popular-time-widget-instance',
			'jpa/most-popular-time',
			2,
			1,
			2
		),
		get_dashboard_default_widget_instance(
			'default-most-popular-day-widget-instance',
			'jpa/most-popular-day',
			3,
			1,
			2
		),
		// Row 3: the two post spotlights.
		get_dashboard_default_widget_instance(
			'default-popular-post-widget-instance',
			'jpa/popular-post',
			4,
			2,
			2
		),
		get_dashboard_default_widget_instance(
			'default-latest-post-widget-instance',
			'jpa/latest-post',
			5,
			1,
			2
		),
		// Row 4: posting-activity heatmap.
		get_dashboard_default_widget_instance(
			'default-posting-activity-widget-instance',
			'jpa/posting-activity',
			6,
			3,
			1
		),
		// Row 5: the all-time views table, one row per year. Two rows tall so a
		// few years fit before the grid scrolls.
		get_dashboard_default_widget_instance(
			'default-views-over-years-widget-instance',
			'jpa/views-over-years',
			7,
			3,
			2
		),
		// Row 6: tags + most commented posts.
		get_dashboard_default_widget_instance(
			'default-tags-widget-instance',
			'jpa/tags',
			8,
			2,
			2
		),
		get_dashboard_default_widget_instance(
			'default-most-commented-posts-widget-instance',
			'jpa/most-commented-posts',
			9,
			1,
			2
		),
		// Row 7: shares + most commented authors.
		get_dashboard_default_widget_instance(
			'default-shares-widget-instance',
			'jpa/shares',
			10,
			1,
			2
		),
		get_dashboard_default_widget_instance(
			'default-most-commented-authors-widget-instance',
			'jpa/most-commented-authors',
			11,
			2,
			2
		),
	);
}

/**
 * The Subscribers tab's default widget layout.
 *
 * @return array Widget instances.
 */
function get_subscribers_section_default_layout() {
	return array(
		// Row 1: subscribers chart.
		get_dashboard_default_widget_instance(
			'default-subscribers-chart-widget-instance',
			'jpa/subscribers-chart',
			0,
			3,
			2
		),
		// Row 2: subscriber highlights.
		get_dashboard_default_widget_instance(
			'default-subscriber-highlights-widget-instance',
			'jpa/subscriber-highlights',
			1,
			3,
			1
		),
		// Row 3: latest subscribers + the wider latest emails sent table.
		get_dashboard_default_widget_instance(
			'default-subscribers-list-widget-instance',
			'jpa/subscribers-list',
			2,
			1,
			2
		),
		get_dashboard_default_widget_instance(
			'default-subscribers-emails-widget-instance',
			'jpa/stats-emails',
			3,
			2,
			2,
			array(
				'metric' => 'opens',
			)
		),
	);
}

/**
 * The Store tab's default widget layout.
 *
 * @return array Widget instances.
 */
function get_store_section_default_layout() {
	return array(
		get_dashboard_default_widget_instance(
			'default-store-performance-widget-instance',
			'jpa/store-performance',
			0,
			2,
			1
		),
		get_dashboard_default_widget_instance(
			'default-total-sales-over-time-widget-instance',
			'jpa/total-sales-over-time',
			1,
			1,
			1
		),
		get_dashboard_default_widget_instance(
			'default-conversion-rate-widget-instance',
			'jpa/conversion-rate',
			2,
			1,
			1
		),
		get_dashboard_default_widget_instance(
			'default-orders-over-time-widget-instance',
			'jpa/orders-over-time',
			3,
			1,
			1
		),
		get_dashboard_default_widget_instance(
			'default-average-order-value-widget-instance',
			'jpa/average-order-value',
			4,
			1,
			1
		),
		get_dashboard_default_widget_instance(
			'default-top-performing-products-widget-instance',
			'jpa/top-performing-products',
			5,
			1,
			1
		),
		get_dashboard_default_widget_instance(
			'default-new-vs-returning-customer-widget-instance',
			'jpa/new-vs-returning-customer',
			6,
			1,
			1
		),
		get_dashboard_default_widget_instance(
			'default-payment-status-widget-instance',
			'jpa/payment-status',
			7,
			1,
			1
		),
		get_dashboard_default_widget_instance(
			'default-orders-fulfillment-widget-instance',
			'jpa/orders-fulfillment',
			8,
			1,
			1
		),
	);
}

/**
 * The Ads tab's default widget layout.
 *
 * @return array Widget instances.
 */
function get_ads_section_default_layout() {
	return array(
		// Row 1: WordAds chart.
		get_dashboard_default_widget_instance(
			'default-wordads-chart-tabs-widget-instance',
			'jpa/wordads-chart-tabs',
			0,
			3,
			2
		),
		// Row 2: all-time balance.
		get_dashboard_default_widget_instance(
			'default-wordads-highlights-widget-instance',
			'jpa/wordads-highlights',
			1,
			3,
			1
		),
		// Row 3: earnings history.
		get_dashboard_default_widget_instance(
			'default-wordads-earnings-history-widget-instance',
			'jpa/wordads-earnings-history',
			2,
			1,
			2
		),
	);
}

/**
 * Registers the default Premium Analytics dashboard sections.
 *
 * Hooked on the registration action and safe to call directly: a section already registered
 * is skipped.
 *
 * @param Dashboard_Section_Registry|null $registry Optional. The registry being hydrated. Defaults to the main instance.
 * @return void
 */
function register_default_dashboard_sections( $registry = null ) {
	if ( ! $registry instanceof Dashboard_Section_Registry ) {
		$registry = Dashboard_Section_Registry::get_instance();
	}

	$sections = array(
		'analytics/traffic'     => array(
			'label'          => __( 'Traffic', 'jetpack-premium-analytics-pkg' ),
			'title'          => __( 'Site traffic', 'jetpack-premium-analytics-pkg' ),
			'order'          => 10,
			'default_layout' => __NAMESPACE__ . '\\get_traffic_section_default_layout',
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
			'default_layout'      => __NAMESPACE__ . '\\get_insights_section_default_layout',
		),

		'analytics/subscribers' => array(
			'label'               => __( 'Subscribers', 'jetpack-premium-analytics-pkg' ),
			'title'               => __( 'Subscribers stats', 'jetpack-premium-analytics-pkg' ),
			'order'               => 30,
			'is_available'        => __NAMESPACE__ . '\\is_subscribers_dashboard_section_available',
			// Only the summary chart supports dates, so it owns the control. No
			// Subscribers widget supports comparison.
			'date_filter_options' => array(
				'with_date_comparison'     => false,
				'with_header_date_control' => false,
			),
			'default_layout'      => __NAMESPACE__ . '\\get_subscribers_section_default_layout',
		),

		// Store registers no heading of its own, so it falls back to the label.
		'woocommerce/store'     => array(
			'label'          => __( 'Store', 'jetpack-premium-analytics-pkg' ),
			'order'          => 40,
			'is_available'   => __NAMESPACE__ . '\\is_woocommerce_dashboard_section_available_to_current_user',
			// Nothing backfills historical orders to WordPress.com but the analytics
			// full sync. The site sections above read data it already holds.
			'requires_sync'  => true,
			'default_layout' => __NAMESPACE__ . '\\get_store_section_default_layout',
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
			'default_layout'      => __NAMESPACE__ . '\\get_ads_section_default_layout',
		),
	);

	foreach ( $sections as $id => $args ) {
		if ( ! $registry->is_registered( DASHBOARD_NAME, $id ) ) {
			$registry->register( DASHBOARD_NAME, $id, $args );
		}
	}
}

// Registered when the registry hydrates, through the same action a plugin extending the dashboard uses.
add_action( Dashboard_Section_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_default_dashboard_sections' );
