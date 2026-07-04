<?php
/**
 * Tests for the CSV export ReportDataFetcher pure helpers (merge/normalize logic).
 *
 * The network methods fetch()/make_proxy_request() are exercised against the live site
 * (they call the WPCom proxy); these tests cover the data-shaping methods that need no network.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports\OrdersOverTimeController;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

require_once __DIR__ . '/fixtures/class-spy-logger.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\ReportDataFetcher
 */
#[CoversClass( ReportDataFetcher::class )]
class ReportDataFetcher_Test extends TestCase {

	/**
	 * Fetcher under test.
	 *
	 * @var ReportDataFetcher
	 */
	private $fetcher;

	protected function setUp(): void {
		parent::setUp();
		$this->fetcher = new ReportDataFetcher( new Spy_Logger() );
	}

	/**
	 * Invoke a private/protected method on the fetcher.
	 *
	 * @param string $method Method name.
	 * @param array  $args   Arguments.
	 * @return mixed
	 */
	private function invoke( string $method, array $args ) {
		$ref = new ReflectionMethod( ReportDataFetcher::class, $method );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true ); // Required before PHP 8.1; a no-op (and deprecated) after.
		}
		return $ref->invokeArgs( $this->fetcher, $args );
	}

	public function test_is_comparison_request() {
		$this->assertTrue(
			$this->invoke(
				'is_comparison_request',
				array(
					array(
						'compare_from' => 'a',
						'compare_to'   => 'b',
					),
				)
			)
		);
		$this->assertFalse( $this->invoke( 'is_comparison_request', array( array( 'compare_from' => 'a' ) ) ) );
		$this->assertFalse( $this->invoke( 'is_comparison_request', array( array() ) ) );
	}

	public function test_extract_base_params_drops_date_range_and_defaults_interval() {
		$base = $this->invoke(
			'extract_base_params',
			array(
				array(
					'interval'     => 'month',
					'from'         => '2025-01-01',
					'to'           => '2025-02-01',
					'compare_from' => '2024-01-01',
					'compare_to'   => '2024-02-01',
					'orderby'      => 'product_gross_revenue',
				),
			)
		);

		$this->assertSame( 'month', $base['interval'] );
		$this->assertSame( 'product_gross_revenue', $base['orderby'] );
		$this->assertArrayNotHasKey( 'from', $base );
		$this->assertArrayNotHasKey( 'compare_to', $base );

		// Interval defaults to 'day' when omitted.
		$this->assertSame( 'day', $this->invoke( 'extract_base_params', array( array() ) )['interval'] );
	}

	public function test_get_default_value_for_field_uses_controller_then_empty_string() {
		$controller = new OrdersOverTimeController( ReportRegistry::instance() );

		$this->assertSame( 0, $this->invoke( 'get_default_value_for_field', array( 'orders_no', $controller ) ) );
		$this->assertSame( '', $this->invoke( 'get_default_value_for_field', array( 'unknown_field', $controller ) ) );
		// No controller => always empty string.
		$this->assertSame( '', $this->invoke( 'get_default_value_for_field', array( 'orders_no', null ) ) );
	}

	public function test_create_empty_item_mirrors_keys_with_defaults() {
		$controller = new OrdersOverTimeController( ReportRegistry::instance() );

		$empty = $this->invoke(
			'create_empty_item',
			array(
				array(
					'orders_no' => 9,
					'other'     => 'x',
				),
				$controller,
			)
		);

		$this->assertSame(
			array(
				'orders_no' => 0,
				'other'     => '',
			),
			$empty
		);
	}

	public function test_merge_datasets_pads_short_comparison_with_empty_items() {
		$controller = new OrdersOverTimeController( ReportRegistry::instance() );

		$merged = $this->invoke(
			'merge_datasets',
			array(
				array( 'data' => array( array( 'orders_no' => 5 ), array( 'orders_no' => 8 ) ) ),
				array( 'data' => array( array( 'orders_no' => 3 ) ) ),
				$controller,
				'comparison_',
			)
		);

		// First row gets the real comparison value.
		$this->assertSame( 3, $merged['data'][0]['comparison_orders_no'] );
		// Second row has no comparison counterpart, so it is padded with the default (0).
		$this->assertSame( 0, $merged['data'][1]['comparison_orders_no'] );
	}
}
