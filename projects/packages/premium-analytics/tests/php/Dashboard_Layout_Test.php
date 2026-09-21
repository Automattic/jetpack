<?php
/**
 * Tests for Premium Analytics dashboard layout defaults.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/dashboard-layout.php';

/**
 * Tests for Premium Analytics dashboard layout defaults.
 */
class Dashboard_Layout_Test extends BaseTestCase {

	/**
	 * Reset constants and availability filters between tests.
	 */
	public function tear_down() {
		Constants::clear_constants();
		// The default layout reaches Host::is_wpcom_platform(), which memoizes
		// `is_woa_site` past Constants::clear_constants().
		Cache::clear();
		remove_all_filters( VIDEOPRESS_AVAILABLE_FILTER );
		parent::tear_down();
	}

	/**
	 * Non-Premium-Analytics dashboards are left untouched.
	 */
	public function test_seed_default_dashboard_layout_ignores_other_dashboards() {
		$layout = array(
			array(
				'uuid' => 'existing-widget',
				'type' => 'example/widget',
			),
		);

		$this->assertSame( $layout, seed_default_dashboard_layout( $layout, 'other_dashboard' ) );
	}

	/**
	 * The base Premium Analytics dashboard keeps using the traffic tab default.
	 */
	public function test_dashboard_name_resolves_traffic_default() {
		$layout       = get_dashboard_default_layout_for( DASHBOARD_NAME );
		$traffic      = get_dashboard_default_layout_for( DASHBOARD_TRAFFIC_SECTION_ID );
		$layout_types = array_column( $layout, 'type' );

		$this->assertSame( $traffic, $layout );
		$this->assertContains( 'jpa/traffic-chart', $layout_types );
		$this->assertNotContains( 'jpa/hello-world', $layout_types );
	}

	/**
	 * Default layouts pass through the availability policy: on self-hosted
	 * Jetpack sites (this test env), Simple-only widget instances are dropped.
	 */
	public function test_traffic_default_excludes_simple_only_widgets_on_self_hosted() {
		$layout_types = array_column( get_dashboard_default_layout_for( DASHBOARD_TRAFFIC_SECTION_ID ), 'type' );

		$this->assertNotContains( 'jpa/file-downloads', $layout_types, 'Simple-only widget instances must not be part of the default layout on self-hosted sites.' );
		$this->assertContains( 'jpa/clicks', $layout_types, 'Regular widget instances remain in the default layout.' );
	}

	/**
	 * The Top videos instance follows VideoPress, which this test env lacks.
	 */
	public function test_traffic_default_excludes_videopress_widget_without_videopress() {
		$layout_types = array_column( get_dashboard_default_layout_for( DASHBOARD_TRAFFIC_SECTION_ID ), 'type' );

		$this->assertNotContains( 'jpa/videopress', $layout_types, 'Top videos must not be part of the default layout without VideoPress.' );
	}

	/**
	 * With VideoPress, the Top videos instance is back in the default layout.
	 */
	public function test_traffic_default_keeps_videopress_widget_with_videopress() {
		add_filter( VIDEOPRESS_AVAILABLE_FILTER, '__return_true' );

		$layout_types = array_column( get_dashboard_default_layout_for( DASHBOARD_TRAFFIC_SECTION_ID ), 'type' );

		$this->assertContains( 'jpa/videopress', $layout_types );
	}

	/**
	 * WPCOM Simple keeps Simple-only widgets in the default layout.
	 */
	public function test_traffic_default_keeps_simple_only_widgets_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		$layout_types = array_column( get_dashboard_default_layout_for( DASHBOARD_TRAFFIC_SECTION_ID ), 'type' );

		$this->assertContains( 'jpa/file-downloads', $layout_types );
	}

	/**
	 * Shares is Simple-only too, so the Insights default drops it on self-hosted
	 * Jetpack sites (this test env).
	 */
	public function test_insights_default_excludes_shares_on_self_hosted() {
		$layout_types = array_column( get_dashboard_default_layout_for( DASHBOARD_INSIGHTS_SECTION_ID ), 'type' );

		$this->assertNotContains( 'jpa/shares', $layout_types, 'Simple-only widget instances must not be part of the default layout on self-hosted sites.' );
		$this->assertContains( 'jpa/tags', $layout_types, 'Regular widget instances remain in the default layout.' );
	}

	/**
	 * WPCOM Simple keeps Shares in the Insights default.
	 */
	public function test_insights_default_keeps_shares_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		$layout_types = array_column( get_dashboard_default_layout_for( DASHBOARD_INSIGHTS_SECTION_ID ), 'type' );

		$this->assertContains( 'jpa/shares', $layout_types );
	}

	/**
	 * Traffic section aliases resolve to the same default layout.
	 */
	public function test_traffic_aliases_resolve_same_default_layout() {
		$this->assertSame(
			get_dashboard_default_layout_for( DASHBOARD_TRAFFIC_SECTION_ID ),
			get_dashboard_default_layout_for( 'analytics/traffic' )
		);
	}

	/**
	 * The traffic tab receives its bundled traffic widgets.
	 */
	public function test_seed_default_dashboard_layout_adds_traffic_widgets() {
		$layout          = seed_default_dashboard_layout( array(), DASHBOARD_TRAFFIC_SECTION_ID );
		$layout_by_uuid  = array_column( $layout, null, 'uuid' );
		$layout_types    = array_column( $layout, 'type' );
		$utm_widget_uuid = 'default-utm-insights-widget-instance';

		// uuid => [ type, width, order ]; widths fill the three-column grid.
		$expected = array(
			'default-traffic-chart-widget-instance'   => array( 'jpa/traffic-chart', 3, 0 ),
			'default-stats-top-posts-widget-instance' => array( 'jpa/stats-top-posts', 1, 1 ),
			'default-referrers-widget-instance'       => array( 'jpa/referrers', 1, 2 ),
			'default-devices-widget-instance'         => array( 'jpa/devices', 1, 3 ),
			'default-locations-widget-instance'       => array( 'jpa/locations', 2, 4 ),
			'default-top-platforms-widget-instance'   => array( 'jpa/top-platforms', 1, 5 ),
			'default-utm-insights-widget-instance'    => array( 'jpa/utm-insights', 1, 6 ),
			'default-clicks-widget-instance'          => array( 'jpa/clicks', 1, 7 ),
			'default-videopress-widget-instance'      => array( 'jpa/videopress', 1, 8 ),
			'default-authors-widget-instance'         => array( 'jpa/authors', 1, 9 ),
			'default-search-terms-widget-instance'    => array( 'jpa/search-terms', 1, 10 ),
			'default-file-downloads-widget-instance'  => array( 'jpa/file-downloads', 1, 11 ),
		);

		$this->assertSame( array_keys( $expected ), array_column( $layout, 'uuid' ) );

		foreach ( $expected as $uuid => $instance ) {
			list( $type, $width, $order ) = $instance;

			$this->assertSame( $type, $layout_by_uuid[ $uuid ]['type'], $uuid );
			$this->assertSame(
				array(
					'width'  => $width,
					'height' => 2,
					'order'  => $order,
				),
				$layout_by_uuid[ $uuid ]['placement'],
				$uuid
			);
		}

		// Plan usage is intentionally not a default (and held back entirely while the paid plan is revised).
		$this->assertNotContains( 'jpa/plan-usage', $layout_types );

		$this->assertSame(
			array(
				'utmDimension' => 'utm_source,utm_medium',
			),
			$layout_by_uuid[ $utm_widget_uuid ]['attributes']
		);
	}

	/**
	 * The insights tab receives its bundled stats widgets.
	 */
	public function test_seed_default_dashboard_layout_adds_insights_widgets() {
		$layout         = seed_default_dashboard_layout( array(), DASHBOARD_INSIGHTS_SECTION_ID );
		$layout_by_uuid = array_column( $layout, null, 'uuid' );
		$layout_types   = array_column( $layout, 'type' );

		// uuid => [ type, width, height, order ], in the design's three-column rows.
		$expected = array(
			'default-annual-highlights-widget-instance'    => array( 'jpa/annual-highlights', 3, 1, 0 ),
			'default-all-time-stats-widget-instance'       => array( 'jpa/all-time-stats', 1, 2, 1 ),
			'default-most-popular-time-widget-instance'    => array( 'jpa/most-popular-time', 1, 2, 2 ),
			'default-most-popular-day-widget-instance'     => array( 'jpa/most-popular-day', 1, 2, 3 ),
			'default-popular-post-widget-instance'         => array( 'jpa/popular-post', 2, 2, 4 ),
			'default-latest-post-widget-instance'          => array( 'jpa/latest-post', 1, 2, 5 ),
			'default-posting-activity-widget-instance'     => array( 'jpa/posting-activity', 3, 1, 6 ),
			'default-views-over-years-widget-instance'     => array( 'jpa/views-over-years', 3, 2, 7 ),
			'default-tags-widget-instance'                 => array( 'jpa/tags', 2, 2, 8 ),
			'default-most-commented-posts-widget-instance' => array( 'jpa/most-commented-posts', 1, 2, 9 ),
			'default-shares-widget-instance'               => array( 'jpa/shares', 1, 2, 10 ),
			'default-most-commented-authors-widget-instance' => array( 'jpa/most-commented-authors', 2, 2, 11 ),
		);

		$this->assertSame( array_keys( $expected ), array_column( $layout, 'uuid' ) );

		foreach ( $expected as $uuid => $instance ) {
			list( $type, $width, $height, $order ) = $instance;

			$this->assertSame( $type, $layout_by_uuid[ $uuid ]['type'], $uuid );
			$this->assertSame(
				array(
					'width'  => $width,
					'height' => $height,
					'order'  => $order,
				),
				$layout_by_uuid[ $uuid ]['placement'],
				$uuid
			);
		}

		$this->assertNotContains( 'jpa/authors', $layout_types );
		$this->assertNotContains( 'jpa/videopress', $layout_types );
		// Emails is not an Insights module — it lives on the Subscribers tab.
		$this->assertNotContains( 'jpa/stats-emails', $layout_types );
		// The Comments module ships as two focused widgets, not one toggled widget.
		$this->assertNotContains( 'jpa/comments', $layout_types );
		// The period widgets are held back while their return is decided (WOOA7S-2020).
		$this->assertNotContains( 'jpa/total-views', $layout_types );
		$this->assertNotContains( 'jpa/total-visitors', $layout_types );
		$this->assertNotContains( 'jpa/popular-days', $layout_types );
		$this->assertNotContains( 'jpa/popular-hours', $layout_types );

		// Highlights falls back to the widget's own default metric list.
		$this->assertArrayNotHasKey(
			'attributes',
			$layout_by_uuid['default-annual-highlights-widget-instance']
		);

		// All-time stats has no attributes: it always shows every total.
		$this->assertArrayNotHasKey(
			'attributes',
			$layout_by_uuid['default-all-time-stats-widget-instance']
		);

		$this->assertSame(
			get_dashboard_default_layout_for( DASHBOARD_INSIGHTS_SECTION_ID ),
			get_dashboard_default_layout_for( 'analytics/insights' )
		);
	}

	/**
	 * The subscribers tab receives its bundled subscriber widgets.
	 */
	public function test_seed_default_dashboard_layout_adds_subscribers_widgets() {
		$layout         = seed_default_dashboard_layout( array(), DASHBOARD_SUBSCRIBERS_SECTION_ID );
		$layout_by_uuid = array_column( $layout, null, 'uuid' );

		// uuid => [ type, width, height, order ]; each row fills the three-column grid.
		$expected = array(
			'default-subscribers-chart-widget-instance'  => array( 'jpa/subscribers-chart', 3, 2, 0 ),
			'default-subscriber-highlights-widget-instance' => array( 'jpa/subscriber-highlights', 3, 1, 1 ),
			'default-subscribers-list-widget-instance'   => array( 'jpa/subscribers-list', 1, 2, 2 ),
			'default-subscribers-emails-widget-instance' => array( 'jpa/stats-emails', 2, 2, 3 ),
		);

		$this->assertSame( array_keys( $expected ), array_column( $layout, 'uuid' ) );

		foreach ( $expected as $uuid => $instance ) {
			list( $type, $width, $height, $order ) = $instance;

			$this->assertSame( $type, $layout_by_uuid[ $uuid ]['type'], $uuid );
			$this->assertSame(
				array(
					'width'  => $width,
					'height' => $height,
					'order'  => $order,
				),
				$layout_by_uuid[ $uuid ]['placement'],
				$uuid
			);
		}

		// No attributes, so the highlights show every metric the widget offers.
		$this->assertArrayNotHasKey( 'attributes', $layout_by_uuid['default-subscriber-highlights-widget-instance'] );

		$this->assertSame(
			array(
				'metric' => 'opens',
			),
			$layout_by_uuid['default-subscribers-emails-widget-instance']['attributes']
		);
		$this->assertSame(
			get_dashboard_default_layout_for( DASHBOARD_SUBSCRIBERS_SECTION_ID ),
			get_dashboard_default_layout_for( 'analytics/subscribers' )
		);
	}

	/**
	 * The store tab receives its bundled store widgets.
	 */
	public function test_seed_default_dashboard_layout_adds_store_widgets() {
		$layout       = seed_default_dashboard_layout( array(), DASHBOARD_STORE_SECTION_ID );
		$layout_types = array_column( $layout, 'type' );

		$this->assertContains( 'jpa/store-performance', $layout_types );
		$this->assertContains( 'jpa/total-sales-over-time', $layout_types );
		$this->assertContains( 'jpa/conversion-rate', $layout_types );
		$this->assertContains( 'jpa/orders-over-time', $layout_types );
		$this->assertContains( 'jpa/top-performing-products', $layout_types );
		$this->assertSame(
			get_dashboard_default_layout_for( DASHBOARD_STORE_SECTION_ID ),
			get_dashboard_default_layout_for( 'woocommerce/store' )
		);
	}

	/**
	 * The Ads tab receives its WordAds widgets in the prototype's order.
	 */
	public function test_seed_default_dashboard_layout_adds_ads_widgets() {
		$layout         = seed_default_dashboard_layout( array(), DASHBOARD_ADS_SECTION_ID );
		$layout_by_uuid = array_column( $layout, null, 'uuid' );

		// uuid => [ type, width, height, order ]; widths fill the three-column grid.
		$expected = array(
			'default-wordads-chart-tabs-widget-instance' => array( 'jpa/wordads-chart-tabs', 3, 2, 0 ),
			'default-wordads-highlights-widget-instance' => array( 'jpa/wordads-highlights', 3, 1, 1 ),
			'default-wordads-earnings-history-widget-instance' => array( 'jpa/wordads-earnings-history', 1, 2, 2 ),
		);

		$this->assertSame( array_keys( $expected ), array_column( $layout, 'uuid' ) );

		foreach ( $expected as $uuid => $instance ) {
			list( $type, $width, $height, $order ) = $instance;

			$this->assertSame( $type, $layout_by_uuid[ $uuid ]['type'], $uuid );
			$this->assertSame(
				array(
					'width'  => $width,
					'height' => $height,
					'order'  => $order,
				),
				$layout_by_uuid[ $uuid ]['placement'],
				$uuid
			);
		}

		// The chart's bucket follows the page interval control, so no default
		// instance seeds attributes any more.
		foreach ( $layout as $instance ) {
			$this->assertArrayNotHasKey( 'attributes', $instance, $instance['uuid'] );
		}
		$this->assertSame(
			get_dashboard_default_layout_for( DASHBOARD_ADS_SECTION_ID ),
			get_dashboard_default_layout_for( 'analytics/ads' )
		);
	}

	/**
	 * An existing default instance is not duplicated.
	 */
	public function test_seed_default_dashboard_layout_does_not_duplicate_existing_widget() {
		$existing_widget = array(
			'uuid' => 'default-utm-insights-widget-instance',
			'type' => 'jpa/utm-insights',
		);

		$layout  = seed_default_dashboard_layout( array( $existing_widget ), DASHBOARD_TRAFFIC_SECTION_ID );
		$widgets = array_filter(
			$layout,
			static function ( $widget ) {
				return 'default-utm-insights-widget-instance' === $widget['uuid'];
			}
		);

		$this->assertCount( 1, $widgets );
		$this->assertSame( $existing_widget, reset( $widgets ) );
	}
}
