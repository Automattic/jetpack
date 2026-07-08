<?php
/**
 * Direct tests for Abstract_Csv_Report_Controller's shared formatting/empty-row helpers,
 * exercised through a fixture controller (the concrete report controllers live in later PRs).
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

require_once __DIR__ . '/fixtures/class-fake-merge-controller.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Abstract_Csv_Report_Controller
 */
#[CoversClass( Abstract_Csv_Report_Controller::class )]
class AbstractController_Test extends TestCase {

	private function controller(): Fake_Merge_Controller {
		return new Fake_Merge_Controller( new Report_Registry() );
	}

	/**
	 * Invoke a protected method on the controller (or statically).
	 *
	 * @param string $method Method name.
	 * @param array  $args   Arguments.
	 * @return mixed
	 */
	private function invoke( string $method, array $args ) {
		$ref = new ReflectionMethod( Abstract_Csv_Report_Controller::class, $method );
		if ( PHP_VERSION_ID < 80100 ) {
			$ref->setAccessible( true ); // Required before PHP 8.1; a no-op (and deprecated) after.
		}
		return $ref->invokeArgs( $ref->isStatic() ? null : $this->controller(), $args );
	}

	public function test_format_amount() {
		$this->assertSame( '1234.50', $this->invoke( 'format_amount', array( 1234.5 ) ) );
		$this->assertSame( '0.00', $this->invoke( 'format_amount', array( 0 ) ) );
		$this->assertSame( '-12.00', $this->invoke( 'format_amount', array( -12 ) ) );
		// No thousands separator (keeps the CSV machine-parseable).
		$this->assertSame( '1000.00', $this->invoke( 'format_amount', array( 1000 ) ) );
		// Non-numeric falls back to 0.00.
		$this->assertSame( '0.00', $this->invoke( 'format_amount', array( 'not-a-number' ) ) );
	}

	public function test_format_time_interval() {
		$item = array( 'date_start' => '2026-03-15 00:00:00' );
		$this->assertSame( '2026-03-15', $this->invoke( 'format_time_interval', array( $item, 'day' ) ) );
		$this->assertSame( '2026-03-15 00:00', $this->invoke( 'format_time_interval', array( $item, 'hour' ) ) );
		// Missing/empty/invalid date_start yields an empty interval, not an epoch.
		$this->assertSame( '', $this->invoke( 'format_time_interval', array( array(), 'day' ) ) );
		$this->assertSame( '', $this->invoke( 'format_time_interval', array( array( 'date_start' => 'not-a-date' ), 'day' ) ) );
	}

	public function test_get_interval_label() {
		$this->assertSame( 'Month', $this->invoke( 'get_interval_label', array( 'month' ) ) );
		$this->assertSame( 'Hour', $this->invoke( 'get_interval_label', array( 'hour' ) ) );
		// Null / unknown interval falls back to "Date".
		$this->assertSame( 'Date', $this->invoke( 'get_interval_label', array( null ) ) );
		$this->assertSame( 'Date', $this->invoke( 'get_interval_label', array( 'decade' ) ) );
	}

	public function test_is_row_empty() {
		$this->assertTrue( $this->invoke( 'is_row_empty', array( array( 'name' => '' ), array( 'name' ) ) ) );
		$this->assertFalse( $this->invoke( 'is_row_empty', array( array( 'name' => 'Standard' ), array( 'name' ) ) ) );
		// Empty only when every checked field is empty.
		$this->assertFalse(
			$this->invoke(
				'is_row_empty',
				array(
					array(
						'a' => '',
						'b' => 'x',
					),
					array( 'a', 'b' ),
				)
			)
		);
		$this->assertTrue(
			$this->invoke(
				'is_row_empty',
				array(
					array(
						'a' => '',
						'b' => '',
					),
					array( 'a', 'b' ),
				)
			)
		);
	}

	public function test_format_row_with_comparison_merges_prefixed_fields() {
		// Fake controller's format_row_for_csv is a passthrough, so this exercises the abstract's
		// split of base vs comparison_-prefixed fields and re-prefixing of the comparison side.
		$row = $this->controller()->format_row_with_comparison(
			array(
				'product_id'            => 1,
				'sales'                 => 10,
				'comparison_product_id' => 1,
				'comparison_sales'      => 7,
			)
		);
		$this->assertSame( 10, $row['sales'] );
		$this->assertSame( 7, $row['comparison_sales'] );
	}
}
