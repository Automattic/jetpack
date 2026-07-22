<?php
/**
 * Tests for the widget type availability layer.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/widget-types.php';
require_once __DIR__ . '/../../src/dashboard-sections.php';
require_once __DIR__ . '/../../src/widget-availability.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_available_widget_types
 * @covers ::Automattic\Jetpack\PremiumAnalytics\filter_registrable_widget_types_by_environment
 * @covers ::Automattic\Jetpack\PremiumAnalytics\remove_dev_only_widget_types
 * @covers ::Automattic\Jetpack\PremiumAnalytics\filter_registrable_widget_types_by_plugin
 * @covers ::Automattic\Jetpack\PremiumAnalytics\remove_plugin_gated_widget_types
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_available_widget_types' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\filter_registrable_widget_types_by_environment' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\remove_dev_only_widget_types' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\filter_registrable_widget_types_by_plugin' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\remove_plugin_gated_widget_types' )]
class Widget_Availability_Test extends BaseTestCase {

	/**
	 * Reset availability filters between tests.
	 */
	public function tear_down() {
		remove_all_filters( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER );

		parent::tear_down();
	}

	/**
	 * Candidate set shaped like the build manifest entries.
	 *
	 * @return array[] List of widget candidates.
	 */
	private function widget_candidates() {
		return array(
			array(
				'name'     => 'jpa/react-query-dev-tool',
				'category' => 'developer',
			),
			array(
				'name'     => 'jpa/hello-world',
				'category' => 'demo',
			),
		);
	}

	/**
	 * Candidate set spanning the commerce categories and an ungated one.
	 *
	 * @return array[] List of widget candidates.
	 */
	private function commerce_widget_candidates() {
		return array(
			array(
				'name'     => 'jpa/traffic-chart',
				'category' => 'traffic',
			),
			array(
				'name'     => 'jpa/store-performance',
				'category' => 'store',
			),
			array(
				'name'     => 'jpa/orders-over-time',
				'category' => 'orders',
			),
			array(
				'name'     => 'jpa/sales-by-coupon-usage',
				'category' => 'coupons',
			),
			array(
				'name'     => 'jpa/bookings-over-time',
				'category' => 'bookings',
			),
		);
	}

	/**
	 * In production, developer-only candidates are dropped; the rest pass through.
	 */
	public function test_dev_only_widget_removed_in_production() {
		$names = array_column( remove_dev_only_widget_types( $this->widget_candidates(), 'production' ), 'name' );

		$this->assertNotContains( 'jpa/react-query-dev-tool', $names, 'Developer-only widgets must be hidden in production.' );
		$this->assertContains( 'jpa/hello-world', $names, 'Regular widgets remain available.' );
	}

	/**
	 * Outside production, candidates pass through (covers the non-production branch).
	 */
	public function test_dev_only_widget_kept_outside_production() {
		foreach ( array( 'local', 'development', 'staging' ) as $environment ) {
			$names = array_column( remove_dev_only_widget_types( $this->widget_candidates(), $environment ), 'name' );

			$this->assertContains( 'jpa/react-query-dev-tool', $names, "Developer-only widgets must remain available in the {$environment} environment." );
			$this->assertContains( 'jpa/hello-world', $names, 'Regular widgets remain available.' );
		}
	}

	/**
	 * The registry-time callback reads the env (production by default) and drops
	 * the developer-only candidate.
	 */
	public function test_registry_filter_callback_drops_dev_widget_by_default() {
		$this->assertSame( 'production', wp_get_environment_type() );

		$names = array_column( filter_registrable_widget_types_by_environment( $this->widget_candidates() ), 'name' );

		$this->assertNotContains( 'jpa/react-query-dev-tool', $names, 'The registry-time callback must drop the developer widget in production.' );
		$this->assertContains( 'jpa/hello-world', $names, 'Regular widgets remain available.' );
	}

	/**
	 * Without WooCommerce, every commerce category is dropped; the rest pass
	 * through. The Bookings extension alone cannot rescue `bookings`.
	 */
	public function test_commerce_widgets_removed_without_woocommerce() {
		foreach ( array( false, true ) as $bookings_available ) {
			$names = array_column( remove_plugin_gated_widget_types( $this->commerce_widget_candidates(), false, $bookings_available ), 'name' );

			$this->assertSame( array( 'jpa/traffic-chart' ), $names, 'Without WooCommerce only ungated categories remain, regardless of Bookings.' );
		}
	}

	/**
	 * With WooCommerce but no Bookings extension, only `bookings` is dropped.
	 */
	public function test_bookings_widgets_removed_without_bookings_plugin() {
		$names = array_column( remove_plugin_gated_widget_types( $this->commerce_widget_candidates(), true, false ), 'name' );

		$this->assertNotContains( 'jpa/bookings-over-time', $names, 'Bookings widgets must be hidden without the Bookings extension.' );
		$this->assertContains( 'jpa/store-performance', $names, 'Store widgets only need WooCommerce.' );
		$this->assertContains( 'jpa/orders-over-time', $names, 'Orders widgets only need WooCommerce.' );
		$this->assertContains( 'jpa/sales-by-coupon-usage', $names, 'Coupons widgets only need WooCommerce.' );
	}

	/**
	 * With both plugins available, everything passes through.
	 */
	public function test_commerce_widgets_kept_with_both_plugins() {
		$this->assertSame(
			$this->commerce_widget_candidates(),
			remove_plugin_gated_widget_types( $this->commerce_widget_candidates(), true, true ),
			'With WooCommerce and Bookings available no candidate is dropped.'
		);
	}

	/**
	 * Candidates without a category are never plugin-gated.
	 */
	public function test_uncategorized_widgets_pass_through() {
		$candidates = array( array( 'name' => 'jpa/no-category' ) );

		$this->assertSame(
			$candidates,
			remove_plugin_gated_widget_types( $candidates, false, false ),
			'A candidate without a category must not be plugin-gated.'
		);
	}

	/**
	 * The registry-time callback follows the store section's availability
	 * signal, so forcing the section visible also surfaces its widgets.
	 */
	public function test_registry_filter_callback_follows_section_availability() {
		$this->assertFalse( is_woocommerce_dashboard_section_available(), 'The test environment must not have WooCommerce loaded.' );

		$names = array_column( filter_registrable_widget_types_by_plugin( $this->commerce_widget_candidates() ), 'name' );
		$this->assertSame( array( 'jpa/traffic-chart' ), $names, 'Without WooCommerce the callback drops every commerce category.' );

		add_filter( WOOCOMMERCE_DASHBOARD_SECTION_AVAILABLE_FILTER, '__return_true' );

		$names = array_column( filter_registrable_widget_types_by_plugin( $this->commerce_widget_candidates() ), 'name' );
		$this->assertContains( 'jpa/store-performance', $names, 'Forcing the section available must surface the store widgets.' );
		$this->assertNotContains( 'jpa/bookings-over-time', $names, 'Bookings widgets still require the Bookings extension.' );
	}

	/**
	 * Reading the available set runs the registry through WIDGET_TYPES_FILTER.
	 */
	public function test_get_available_widget_types_applies_filter() {
		$registry = Widget_Type_Registry::get_instance();
		$registry->register( 'test/sentinel' );

		$callback = static function ( $widget_types ) {
			unset( $widget_types['test/sentinel'] );
			return $widget_types;
		};
		add_filter( WIDGET_TYPES_FILTER, $callback );

		$available = get_available_widget_types();

		remove_filter( WIDGET_TYPES_FILTER, $callback );
		$registry->unregister( 'test/sentinel' );

		$this->assertArrayNotHasKey( 'test/sentinel', $available, 'A filter callback can remove a widget type from the available set.' );
	}
}
