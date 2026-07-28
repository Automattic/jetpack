<?php
/**
 * Tests for Premium Analytics dashboard layout defaults.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\TestCase;
use WP_REST_Server;

require_once __DIR__ . '/../../src/dashboard-layout.php';

/**
 * Tests for Premium Analytics dashboard layout defaults.
 */
class Dashboard_Layout_Test extends TestCase {

	const ROUTE        = '/wpcom/v2/dashboards/(?P<name>[a-z][a-z0-9-]*(?:_[a-z0-9-]+)*)/default-layout';
	const LEGACY_ROUTE = '/jetpack/v4/dashboards/(?P<name>[a-z][a-z0-9-]*(?:_[a-z0-9-]+)*)/default-layout';

	/**
	 * Reset REST globals and constants between tests.
	 */
	protected function tearDown(): void {
		global $wp_rest_server;
		$wp_rest_server = null;
		Constants::clear_constants();
		parent::tearDown();
	}

	/**
	 * The default-layout route uses the WPCOM namespace.
	 */
	public function test_default_layout_route_uses_wpcom_v2_namespace() {
		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();

		if ( false === has_action( 'rest_api_init', __NAMESPACE__ . '\\register_dashboard_default_layout_route' ) ) {
			add_action( 'rest_api_init', __NAMESPACE__ . '\\register_dashboard_default_layout_route' );
		}

		do_action( 'rest_api_init' );

		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::ROUTE, $routes );
		$this->assertArrayNotHasKey( self::LEGACY_ROUTE, $routes );
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
	 * WPCOM Simple keeps Simple-only widgets in the default layout.
	 */
	public function test_traffic_default_keeps_simple_only_widgets_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		$layout_types = array_column( get_dashboard_default_layout_for( DASHBOARD_TRAFFIC_SECTION_ID ), 'type' );

		$this->assertContains( 'jpa/file-downloads', $layout_types );
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
		$layout              = seed_default_dashboard_layout( array(), DASHBOARD_TRAFFIC_SECTION_ID );
		$layout_by_uuid      = array_column( $layout, null, 'uuid' );
		$layout_types        = array_column( $layout, 'type' );
		$utm_widget_uuid     = 'default-utm-insights-widget-instance';
		$top_posts_uuid      = 'default-stats-top-posts-widget-instance';
		$traffic_chart_uuid  = 'default-traffic-chart-widget-instance';
		$file_downloads_uuid = 'default-file-downloads-widget-instance';

		$this->assertContains( 'jpa/traffic-chart', $layout_types );
		$this->assertContains( 'jpa/stats-top-posts', $layout_types );
		$this->assertContains( 'jpa/referrers', $layout_types );
		$this->assertContains( 'jpa/authors', $layout_types );
		$this->assertContains( 'jpa/videopress', $layout_types );
		$this->assertContains( 'jpa/plan-usage', $layout_types );
		$this->assertArrayHasKey( 'default-locations-widget-instance', $layout_by_uuid );
		$this->assertArrayHasKey( $utm_widget_uuid, $layout_by_uuid );
		$this->assertArrayHasKey( $file_downloads_uuid, $layout_by_uuid );

		$this->assertSame(
			array(
				'uuid'       => $utm_widget_uuid,
				'type'       => 'jpa/utm-insights',
				'attributes' => array(
					'utmDimension' => 'utm_source,utm_medium',
					'max'          => 10,
				),
				'placement'  => array(
					'width'  => 1,
					'height' => 2,
					'order'  => 8,
				),
			),
			$layout_by_uuid[ $utm_widget_uuid ]
		);

		$this->assertSame(
			array(
				'uuid'       => $top_posts_uuid,
				'type'       => 'jpa/stats-top-posts',
				'attributes' => array(
					'max' => 10,
				),
				'placement'  => array(
					'width'  => 1,
					'height' => 2,
					'order'  => 1,
				),
			),
			$layout_by_uuid[ $top_posts_uuid ]
		);

		$this->assertSame( 'jpa/traffic-chart', $layout_by_uuid[ $traffic_chart_uuid ]['type'] );
	}

	/**
	 * The insights tab receives its bundled stats widgets.
	 */
	public function test_seed_default_dashboard_layout_adds_insights_widgets() {
		$layout         = seed_default_dashboard_layout( array(), DASHBOARD_INSIGHTS_SECTION_ID );
		$layout_by_uuid = array_column( $layout, null, 'uuid' );
		$layout_types   = array_column( $layout, 'type' );

		$this->assertContains( 'jpa/annual-highlights', $layout_types );
		$this->assertContains( 'jpa/all-time-stats', $layout_types );
		$this->assertContains( 'jpa/latest-post', $layout_types );
		$this->assertContains( 'jpa/posting-activity', $layout_types );
		$this->assertNotContains( 'jpa/authors', $layout_types );
		$this->assertNotContains( 'jpa/videopress', $layout_types );
		// Emails is not an Insights module — it lives on the Subscribers tab.
		$this->assertNotContains( 'jpa/stats-emails', $layout_types );
		$this->assertContains( 'jpa/shares', $layout_types );
		$this->assertSame(
			array(
				'uuid'       => 'default-shares-widget-instance',
				'type'       => 'jpa/shares',
				'attributes' => array(
					'max' => 10,
				),
				'placement'  => array(
					'width'  => 1,
					'height' => 2,
					'order'  => 8,
				),
			),
			$layout_by_uuid['default-shares-widget-instance']
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
		$layout_types   = array_column( $layout, 'type' );

		$this->assertContains( 'jpa/subscriber-highlights', $layout_types );
		$this->assertContains( 'jpa/subscribers-chart', $layout_types );
		$this->assertContains( 'jpa/subscribers-list', $layout_types );
		$this->assertContains( 'jpa/stats-emails', $layout_types );
		$this->assertSame(
			array(
				'uuid'       => 'default-subscribers-list-widget-instance',
				'type'       => 'jpa/subscribers-list',
				'attributes' => array(
					'max' => 6,
				),
				'placement'  => array(
					'width'  => 2,
					'height' => 2,
					'order'  => 2,
				),
			),
			$layout_by_uuid['default-subscribers-list-widget-instance']
		);
		$this->assertSame(
			array(
				'uuid'       => 'default-subscribers-emails-widget-instance',
				'type'       => 'jpa/stats-emails',
				'attributes' => array(
					'max'    => 10,
					'metric' => 'opens',
				),
				'placement'  => array(
					'width'  => 2,
					'height' => 2,
					'order'  => 3,
				),
			),
			$layout_by_uuid['default-subscribers-emails-widget-instance']
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
