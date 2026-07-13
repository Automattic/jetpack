<?php
/**
 * Tests for the comparison-period merge strategies.
 *
 * Index-based merges align by array position and pad gaps with empty strings
 * ("no data for this date"). Id-based merges align by a matching field and pad
 * gaps with the controller's default values ("no activity for this entity"),
 * preserving the matching/identifying fields from the original row.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\MergeStrategy;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Fake_Merge_Controller;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Report_Registry;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Spy_Logger;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

require_once __DIR__ . '/../fixtures/class-spy-logger.php';
require_once __DIR__ . '/../fixtures/class-fake-merge-controller.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\MergeStrategy\Index_Based_Merge_Strategy
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\MergeStrategy\Id_Based_Merge_Strategy
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\MergeStrategy\Abstract_Merge_Strategy
 */
#[CoversClass( Index_Based_Merge_Strategy::class )]
#[CoversClass( Id_Based_Merge_Strategy::class )]
#[CoversClass( Abstract_Merge_Strategy::class )]
class MergeStrategy_Test extends TestCase {

	private function controller(): Fake_Merge_Controller {
		return new Fake_Merge_Controller( new Report_Registry() );
	}

	/**
	 * Invoke a protected method on a merge strategy.
	 *
	 * @param object $strategy The strategy instance.
	 * @param string $method   Method name.
	 * @param array  $args     Arguments.
	 * @return mixed
	 */
	private function invoke( $strategy, string $method, array $args ) {
		$ref = new ReflectionMethod( $strategy, $method );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true ); // Required before PHP 8.1; a no-op (and deprecated) after.
		}
		return $ref->invokeArgs( $strategy, $args );
	}

	public function test_index_based_merges_by_position() {
		$strategy = new Index_Based_Merge_Strategy( new Spy_Logger() );

		$merged = $strategy->merge(
			array( array( 'orders_no' => 5 ), array( 'orders_no' => 8 ) ),
			array( array( 'orders_no' => 3 ) ),
			'comparison_',
			$this->controller()
		);

		// Row 0 aligns with the single comparison row.
		$this->assertSame( 5, $merged[0]['orders_no'] );
		$this->assertSame( 3, $merged[0]['comparison_orders_no'] );

		// Row 1 has no comparison counterpart, so it is padded with an empty
		// string ("no data for this date"), not a numeric default.
		$this->assertSame( 8, $merged[1]['orders_no'] );
		$this->assertSame( '', $merged[1]['comparison_orders_no'] );
	}

	public function test_id_based_matches_by_field_and_pads_with_defaults() {
		$strategy = new Id_Based_Merge_Strategy( 'product_id', new Spy_Logger() );

		$merged = $strategy->merge(
			array(
				array(
					'product_id' => 1,
					'label'      => 'A',
					'sales'      => 10,
				),
				array(
					'product_id' => 2,
					'label'      => 'B',
					'sales'      => 20,
				),
			),
			array(
				array(
					'product_id' => 2,
					'label'      => 'B',
					'sales'      => 7,
				),
			),
			'comparison_',
			$this->controller()
		);

		// Product 1 has no comparison row: numeric fields fall back to the
		// controller default (0), and the matching/identifying fields are
		// copied over from the original row.
		$this->assertSame( 0, $merged[0]['comparison_sales'] );
		$this->assertSame( 1, $merged[0]['comparison_product_id'] );
		$this->assertSame( 'A', $merged[0]['comparison_label'] );

		// Product 2 matches by product_id regardless of ordering.
		$this->assertSame( 7, $merged[1]['comparison_sales'] );
	}

	public function test_id_based_normalizes_int_and_string_keys() {
		$strategy = new Id_Based_Merge_Strategy( 'product_id', new Spy_Logger() );

		// Original uses an int id; comparison uses the string equivalent.
		$merged = $strategy->merge(
			array(
				array(
					'product_id' => 19,
					'sales'      => 10,
				),
			),
			array(
				array(
					'product_id' => '19',
					'sales'      => 4,
				),
			),
			'comparison_',
			$this->controller()
		);

		$this->assertSame( 4, $merged[0]['comparison_sales'] );
	}

	public function test_create_empty_item_uses_controller_defaults_then_empty_string() {
		$strategy   = new Index_Based_Merge_Strategy( new Spy_Logger() );
		$controller = $this->controller();

		$empty = $this->invoke(
			$strategy,
			'create_empty_item',
			array(
				array(
					'sales' => 9,
					'other' => 'x',
				),
				$controller,
			)
		);
		$this->assertSame(
			array(
				'sales' => 0,
				'other' => '',
			),
			$empty
		);

		// A null controller forces empty strings for every field.
		$this->assertSame(
			array( 'sales' => '' ),
			$this->invoke( $strategy, 'create_empty_item', array( array( 'sales' => 9 ), null ) )
		);
	}

	public function test_get_default_value_for_field() {
		$strategy   = new Index_Based_Merge_Strategy( new Spy_Logger() );
		$controller = $this->controller();

		$this->assertSame( 0, $this->invoke( $strategy, 'get_default_value_for_field', array( 'sales', $controller ) ) );
		$this->assertSame( '', $this->invoke( $strategy, 'get_default_value_for_field', array( 'unknown', $controller ) ) );
		$this->assertSame( '', $this->invoke( $strategy, 'get_default_value_for_field', array( 'sales', null ) ) );
	}
}
