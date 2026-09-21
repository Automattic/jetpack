<?php
/**
 * Tests for the dashboard default-layout primitives and the package's bundled defaults.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/dashboard-sections.php';
require_once __DIR__ . '/../../src/default-dashboard-sections.php';

/**
 * Tests for the dashboard default-layout primitives and the package's bundled defaults.
 */
class Dashboard_Layout_Test extends BaseTestCase {

	/**
	 * Default-layout filter callback a test hooked, removed on tear down.
	 *
	 * @var callable|null
	 */
	private $layout_filter = null;

	/**
	 * Register the built-in sections, whose layouts these tests read.
	 */
	public function set_up() {
		parent::set_up();

		register_default_dashboard_sections();
	}

	/**
	 * Reset the section registry, constants, and availability filters between tests.
	 */
	public function tear_down() {
		if ( null !== $this->layout_filter ) {
			remove_filter( DASHBOARD_DEFAULT_LAYOUT_FILTER, $this->layout_filter );
			$this->layout_filter = null;
		}

		$instance = new \ReflectionProperty( Dashboard_Section_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );

		Constants::clear_constants();
		// The default layout reaches Host::is_wpcom_platform(), which memoizes
		// `is_woa_site` past Constants::clear_constants().
		Cache::clear();
		remove_all_filters( VIDEOPRESS_AVAILABLE_FILTER );
		parent::tear_down();
	}

	/**
	 * Hook a default-layout filter callback for the duration of the test.
	 *
	 * @param callable $callback Filter callback receiving the layout and the section id.
	 * @return void
	 */
	private function filter_default_layout( callable $callback ) {
		$this->layout_filter = $callback;
		add_filter( DASHBOARD_DEFAULT_LAYOUT_FILTER, $callback, 10, 2 );
	}

	/**
	 * Widget types a built-in section serves as its default layout.
	 *
	 * @param string $section_id Section identifier.
	 * @return string[]
	 */
	private function served_layout_types( $section_id ) {
		$section = get_registered_dashboard_section( DASHBOARD_NAME, $section_id );

		$this->assertInstanceOf( Dashboard_Section::class, $section );

		return array_column( $section->get_default_layout(), 'type' );
	}

	/**
	 * Assert a layout holds exactly the expected instances, in order and placement.
	 *
	 * @param array $expected Map of uuid to `[ type, width, height, order ]`.
	 * @param array $layout   Widget instances.
	 * @return void
	 */
	private function assert_layout_instances( array $expected, array $layout ) {
		$this->assertSame( array_keys( $expected ), array_column( $layout, 'uuid' ) );

		$layout_by_uuid = array_column( $layout, null, 'uuid' );

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
	}

	/**
	 * The instance helper carries the placement and any attributes.
	 */
	public function test_widget_instance_carries_placement_and_attributes() {
		$this->assertSame(
			array(
				'uuid'       => 'example-instance',
				'type'       => 'example/widget',
				'attributes' => array( 'view' => 'compact' ),
				'placement'  => array(
					'width'  => 2,
					'height' => 1,
					'order'  => 3,
				),
			),
			get_dashboard_default_widget_instance( 'example-instance', 'example/widget', 3, 2, 1, array( 'view' => 'compact' ) )
		);
	}

	/**
	 * Empty attributes are omitted rather than serialized as an empty object.
	 */
	public function test_widget_instance_omits_empty_attributes() {
		$instance = get_dashboard_default_widget_instance( 'example-instance', 'example/widget', 0 );

		$this->assertArrayNotHasKey( 'attributes', $instance );
		$this->assertSame(
			array(
				'width'  => 1,
				'height' => 1,
				'order'  => 0,
			),
			$instance['placement']
		);
	}

	/**
	 * Default layouts pass through the availability policy: on self-hosted
	 * Jetpack sites (this test env), Simple-only widget instances are dropped.
	 */
	public function test_traffic_default_excludes_simple_only_widgets_on_self_hosted() {
		$layout_types = $this->served_layout_types( 'analytics/traffic' );

		$this->assertNotContains( 'jpa/file-downloads', $layout_types, 'Simple-only widget instances must not be part of the default layout on self-hosted sites.' );
		$this->assertContains( 'jpa/clicks', $layout_types, 'Regular widget instances remain in the default layout.' );
	}

	/**
	 * The Top videos instance follows VideoPress, which this test env lacks.
	 */
	public function test_traffic_default_excludes_videopress_widget_without_videopress() {
		$this->assertNotContains( 'jpa/videopress', $this->served_layout_types( 'analytics/traffic' ), 'Top videos must not be part of the default layout without VideoPress.' );
	}

	/**
	 * With VideoPress, the Top videos instance is back in the default layout.
	 */
	public function test_traffic_default_keeps_videopress_widget_with_videopress() {
		add_filter( VIDEOPRESS_AVAILABLE_FILTER, '__return_true' );

		$this->assertContains( 'jpa/videopress', $this->served_layout_types( 'analytics/traffic' ) );
	}

	/**
	 * WPCOM Simple keeps Simple-only widgets in the default layout.
	 */
	public function test_traffic_default_keeps_simple_only_widgets_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertContains( 'jpa/file-downloads', $this->served_layout_types( 'analytics/traffic' ) );
	}

	/**
	 * Shares is Simple-only too, so the Insights default drops it on self-hosted
	 * Jetpack sites (this test env).
	 */
	public function test_insights_default_excludes_shares_on_self_hosted() {
		$layout_types = $this->served_layout_types( 'analytics/insights' );

		$this->assertNotContains( 'jpa/shares', $layout_types, 'Simple-only widget instances must not be part of the default layout on self-hosted sites.' );
		$this->assertContains( 'jpa/tags', $layout_types, 'Regular widget instances remain in the default layout.' );
	}

	/**
	 * WPCOM Simple keeps Shares in the Insights default.
	 */
	public function test_insights_default_keeps_shares_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertContains( 'jpa/shares', $this->served_layout_types( 'analytics/insights' ) );
	}

	/**
	 * A plugin adds a widget instance to one section's default through the filter,
	 * and the other sections are left alone.
	 */
	public function test_filter_adds_a_widget_to_one_section_default() {
		$this->filter_default_layout(
			static function ( $layout, $section_id ) {
				if ( 'analytics/traffic' === $section_id ) {
					$layout[] = get_dashboard_default_widget_instance( 'example-instance', 'example/widget', 20 );
				}

				return $layout;
			}
		);

		$this->assertContains( 'example/widget', $this->served_layout_types( 'analytics/traffic' ) );
		$this->assertNotContains( 'example/widget', $this->served_layout_types( 'analytics/insights' ) );
	}

	/**
	 * The availability policy runs after the additions, so an unsupported instance a
	 * plugin adds is dropped like a bundled one.
	 */
	public function test_availability_policy_covers_instances_the_filter_adds() {
		$this->filter_default_layout(
			static function ( $layout, $section_id ) {
				if ( 'analytics/insights' === $section_id ) {
					$layout[] = get_dashboard_default_widget_instance( 'example-downloads', 'jpa/file-downloads', 20 );
				}

				return $layout;
			}
		);

		$this->assertNotContains( 'jpa/file-downloads', $this->served_layout_types( 'analytics/insights' ) );
	}

	/**
	 * The Traffic tab declares its bundled widgets on the three-column grid.
	 */
	public function test_traffic_section_declares_the_bundled_widgets() {
		$layout         = get_traffic_section_default_layout();
		$layout_by_uuid = array_column( $layout, null, 'uuid' );

		// Widths fill the three-column grid; every tile is two rows tall.
		$this->assert_layout_instances(
			array(
				'default-traffic-chart-widget-instance'   => array( 'jpa/traffic-chart', 3, 2, 0 ),
				'default-stats-top-posts-widget-instance' => array( 'jpa/stats-top-posts', 1, 2, 1 ),
				'default-referrers-widget-instance'       => array( 'jpa/referrers', 1, 2, 2 ),
				'default-devices-widget-instance'         => array( 'jpa/devices', 1, 2, 3 ),
				'default-locations-widget-instance'       => array( 'jpa/locations', 2, 2, 4 ),
				'default-top-platforms-widget-instance'   => array( 'jpa/top-platforms', 1, 2, 5 ),
				'default-utm-insights-widget-instance'    => array( 'jpa/utm-insights', 1, 2, 6 ),
				'default-clicks-widget-instance'          => array( 'jpa/clicks', 1, 2, 7 ),
				'default-videopress-widget-instance'      => array( 'jpa/videopress', 1, 2, 8 ),
				'default-authors-widget-instance'         => array( 'jpa/authors', 1, 2, 9 ),
				'default-search-terms-widget-instance'    => array( 'jpa/search-terms', 1, 2, 10 ),
				'default-file-downloads-widget-instance'  => array( 'jpa/file-downloads', 1, 2, 11 ),
			),
			$layout
		);

		// Plan usage is intentionally not a default (and held back entirely while the paid plan is revised).
		$this->assertNotContains( 'jpa/plan-usage', array_column( $layout, 'type' ) );

		$this->assertSame(
			array(
				'utmDimension' => 'utm_source,utm_medium',
			),
			$layout_by_uuid['default-utm-insights-widget-instance']['attributes']
		);
	}

	/**
	 * The Insights tab declares its bundled stats widgets.
	 */
	public function test_insights_section_declares_the_bundled_widgets() {
		$layout         = get_insights_section_default_layout();
		$layout_by_uuid = array_column( $layout, null, 'uuid' );
		$layout_types   = array_column( $layout, 'type' );

		// In the design's three-column rows.
		$this->assert_layout_instances(
			array(
				'default-annual-highlights-widget-instance' => array( 'jpa/annual-highlights', 3, 1, 0 ),
				'default-all-time-stats-widget-instance'   => array( 'jpa/all-time-stats', 1, 2, 1 ),
				'default-most-popular-time-widget-instance' => array( 'jpa/most-popular-time', 1, 2, 2 ),
				'default-most-popular-day-widget-instance' => array( 'jpa/most-popular-day', 1, 2, 3 ),
				'default-popular-post-widget-instance'     => array( 'jpa/popular-post', 2, 2, 4 ),
				'default-latest-post-widget-instance'      => array( 'jpa/latest-post', 1, 2, 5 ),
				'default-posting-activity-widget-instance' => array( 'jpa/posting-activity', 3, 1, 6 ),
				'default-views-over-years-widget-instance' => array( 'jpa/views-over-years', 3, 2, 7 ),
				'default-tags-widget-instance'             => array( 'jpa/tags', 2, 2, 8 ),
				'default-most-commented-posts-widget-instance' => array( 'jpa/most-commented-posts', 1, 2, 9 ),
				'default-shares-widget-instance'           => array( 'jpa/shares', 1, 2, 10 ),
				'default-most-commented-authors-widget-instance' => array( 'jpa/most-commented-authors', 2, 2, 11 ),
			),
			$layout
		);

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
	}

	/**
	 * The Subscribers tab declares its bundled subscriber widgets.
	 */
	public function test_subscribers_section_declares_the_bundled_widgets() {
		$layout         = get_subscribers_section_default_layout();
		$layout_by_uuid = array_column( $layout, null, 'uuid' );

		// Each row fills the three-column grid.
		$this->assert_layout_instances(
			array(
				'default-subscribers-chart-widget-instance' => array( 'jpa/subscribers-chart', 3, 2, 0 ),
				'default-subscriber-highlights-widget-instance' => array( 'jpa/subscriber-highlights', 3, 1, 1 ),
				'default-subscribers-list-widget-instance' => array( 'jpa/subscribers-list', 1, 2, 2 ),
				'default-subscribers-emails-widget-instance' => array( 'jpa/stats-emails', 2, 2, 3 ),
			),
			$layout
		);

		// No attributes, so the highlights show every metric the widget offers.
		$this->assertArrayNotHasKey( 'attributes', $layout_by_uuid['default-subscriber-highlights-widget-instance'] );

		$this->assertSame(
			array(
				'metric' => 'opens',
			),
			$layout_by_uuid['default-subscribers-emails-widget-instance']['attributes']
		);
	}

	/**
	 * The Store tab declares its bundled store widgets.
	 */
	public function test_store_section_declares_the_bundled_widgets() {
		$layout_types = array_column( get_store_section_default_layout(), 'type' );

		$this->assertContains( 'jpa/store-performance', $layout_types );
		$this->assertContains( 'jpa/total-sales-over-time', $layout_types );
		$this->assertContains( 'jpa/conversion-rate', $layout_types );
		$this->assertContains( 'jpa/orders-over-time', $layout_types );
		$this->assertContains( 'jpa/top-performing-products', $layout_types );
	}

	/**
	 * The Ads tab declares its WordAds widgets in the prototype's order.
	 */
	public function test_ads_section_declares_the_bundled_widgets() {
		$layout = get_ads_section_default_layout();

		// Widths fill the three-column grid.
		$this->assert_layout_instances(
			array(
				'default-wordads-chart-tabs-widget-instance' => array( 'jpa/wordads-chart-tabs', 3, 2, 0 ),
				'default-wordads-highlights-widget-instance' => array( 'jpa/wordads-highlights', 3, 1, 1 ),
				'default-wordads-earnings-history-widget-instance' => array( 'jpa/wordads-earnings-history', 1, 2, 2 ),
			),
			$layout
		);

		// The chart's bucket follows the page interval control, so no default
		// instance seeds attributes any more.
		foreach ( $layout as $instance ) {
			$this->assertArrayNotHasKey( 'attributes', $instance, $instance['uuid'] );
		}
	}
}
