<?php
/**
 * Tests for the CSV export ReportRegistry.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\OrdersOverTimeController;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\TopPerformingProductsController;
use PHPUnit\Framework\Attributes\Before;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionProperty;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\ReportRegistry
 */
#[CoversClass( ReportRegistry::class )]
class ReportRegistry_Test extends TestCase {

	/**
	 * A fresh registry for each test.
	 *
	 * @var ReportRegistry
	 */
	private $registry;

	/**
	 * Reset the singleton so each test starts with an empty registry.
	 *
	 * @before
	 */
	#[Before]
	public function reset_registry() {
		$prop = new ReflectionProperty( ReportRegistry::class, 'instance' );
		$prop->setAccessible( true );
		$prop->setValue( null, null );
		$this->registry = ReportRegistry::instance();
	}

	public function test_instance_is_singleton() {
		$this->assertSame( ReportRegistry::instance(), ReportRegistry::instance() );
	}

	public function test_register_controller_is_idempotent() {
		$controller = new OrdersOverTimeController( $this->registry );

		$this->assertTrue( $this->registry->register_controller( $controller ) );
		$this->assertTrue( $this->registry->is_registered( 'ordersovertime' ) );
		// Second registration of the same key is refused.
		$this->assertFalse( $this->registry->register_controller( $controller ) );
	}

	public function test_get_registered_reports_lists_keys() {
		$this->registry->register_controller( new OrdersOverTimeController( $this->registry ) );
		$this->registry->register_controller( new TopPerformingProductsController( $this->registry ) );

		$this->assertEqualsCanonicalizing(
			array( 'ordersovertime', 'topperformingproducts' ),
			$this->registry->get_registered_reports()
		);
	}

	public function test_delegated_getters_return_controller_values() {
		$this->registry->register_controller( new OrdersOverTimeController( $this->registry ) );

		$this->assertSame( 'reports/orders/by-date', $this->registry->get_data_endpoint( 'ordersovertime' ) );
		$this->assertSame( 'Orders Over Time', $this->registry->get_label( 'ordersovertime' ) );
		$this->assertSame( 1000, $this->registry->get_batch_limit( 'ordersovertime' ) );
		$this->assertIsCallable( $this->registry->get_row_formatter( 'ordersovertime' ) );
	}

	public function test_get_columns_appends_comparison_columns_when_requested() {
		$this->registry->register_controller( new OrdersOverTimeController( $this->registry ) );

		$base = $this->registry->get_columns( 'ordersovertime' );
		$this->assertArrayHasKey( 'orders_no', $base );
		$this->assertArrayNotHasKey( 'comparison_orders_no', $base );

		$with_comparison = $this->registry->get_columns( 'ordersovertime', true );
		$this->assertArrayHasKey( 'orders_no', $with_comparison );
		$this->assertArrayHasKey( 'comparison_orders_no', $with_comparison );
		$this->assertStringContainsString( 'Previous Period', $with_comparison['comparison_orders_no'] );
	}

	public function test_unknown_report_returns_wp_error() {
		$this->assertWPError( $this->registry->get_controller( 'nope' ) );
		$this->assertWPError( $this->registry->get_data_endpoint( 'nope' ) );
		$this->assertWPError( $this->registry->get_columns( 'nope' ) );
		$this->assertWPError( $this->registry->get_label( 'nope' ) );
		$this->assertWPError( $this->registry->get_batch_limit( 'nope' ) );
		$this->assertWPError( $this->registry->get_row_formatter( 'nope' ) );
	}

	/**
	 * Assert a value is a WP_Error with the invalid_report_type code.
	 *
	 * @param mixed $value The value to check.
	 */
	private function assertWPError( $value ) {
		$this->assertInstanceOf( \WP_Error::class, $value );
		$this->assertSame( 'invalid_report_type', $value->get_error_code() );
	}
}
