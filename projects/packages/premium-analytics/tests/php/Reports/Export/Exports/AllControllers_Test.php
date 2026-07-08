<?php
/**
 * Fleet-wide invariants for every registered report controller.
 *
 * Asserts the structural contract the export pipeline relies on: unique report keys,
 * non-empty metadata, and a format_row_for_csv() whose keys line up exactly with the
 * declared column headers. Each report PR adds its controllers to the provider.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\CSVReportControllerInterface;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\ReportRegistry;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class AllControllers_Test extends TestCase {

	/**
	 * Every report controller registered by Export::init().
	 *
	 * @return array<string, class-string[]>
	 */
	public static function controller_provider(): array {
		$classes = array(
			AverageItemsPerOrderController::class,
			AverageOrderValueController::class,
			ConversionRateOverTimeController::class,
			CouponUseOverTimeController::class,
			GrossSalesOverTimeController::class,
			NetSalesOverTimeController::class,
			OrdersFulfilledOverTimeController::class,
			OrdersOverTimeController::class,
			RefundsOverTimeController::class,
			TaxesOverTimeController::class,
			VisitorsOverTimeController::class,
		);

		$cases = array();
		foreach ( $classes as $class ) {
			$cases[ $class ] = array( $class );
		}
		return $cases;
	}

	private function make( string $class ): CSVReportControllerInterface {
		return new $class( ReportRegistry::instance() );
	}

	/**
	 * @dataProvider controller_provider
	 */
	#[DataProvider( 'controller_provider' )]
	public function test_controller_metadata_is_present( string $class ) {
		$c = $this->make( $class );

		$this->assertNotSame( '', $c->get_report_key(), 'report key must be non-empty' );
		$this->assertNotSame( '', $c->get_report_label(), 'report label must be non-empty' );
		$this->assertNotSame( '', $c->get_data_endpoint(), 'data endpoint must be non-empty' );
		$this->assertGreaterThan( 0, $c->get_batch_limit(), 'batch limit must be positive' );

		$headers = $c->get_column_headers();
		$this->assertIsArray( $headers );
		$this->assertNotEmpty( $headers, 'column headers must be non-empty' );
	}

	/**
	 * The formatted row must expose exactly the declared column keys so the CSV
	 * generator can map every value to a header (no orphaned or missing columns).
	 *
	 * @dataProvider controller_provider
	 */
	#[DataProvider( 'controller_provider' )]
	public function test_formatted_row_keys_match_column_headers( string $class ) {
		$c = $this->make( $class );

		// format_row_for_csv() must tolerate a bare item (all fields defaulted).
		$row = $c->format_row_for_csv( array() );
		$this->assertIsArray( $row );
		$this->assertSame(
			array_keys( $c->get_column_headers() ),
			array_keys( $row ),
			$class . ': formatted row keys must match column header keys'
		);
	}

	public function test_report_keys_are_unique() {
		$keys = array();
		foreach ( array_keys( self::controller_provider() ) as $class ) {
			$keys[] = $this->make( $class )->get_report_key();
		}

		$this->assertSame( $keys, array_unique( $keys ), 'report keys must be unique across controllers' );
		$this->assertCount( 11, $keys );
	}
}
