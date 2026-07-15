<?php
/**
 * Tests for client-side CSV export script data.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../src/client-side-csv-exports.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_client_side_csv_exports
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_client_side_csv_exports_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_client_side_csv_exports' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_client_side_csv_exports_script_data' )]
class Client_Side_Csv_Exports_Test extends TestCase {

	/**
	 * @after
	 */
	#[After]
	public function tear_down() {
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_client_side_csv_exports_script_data', 20 );
		remove_all_filters( CLIENT_SIDE_CSV_EXPORTS_ENABLED_FILTER );
	}

	public function test_script_data_disables_client_side_csv_exports_by_default() {
		$data = inject_client_side_csv_exports_script_data(
			array(
				'premium_analytics' => array(
					'initial_full_sync_finished' => 0,
				),
			)
		);

		$this->assertSame( 0, $data['premium_analytics']['initial_full_sync_finished'] );
		$this->assertArrayHasKey( 'client_side_csv_exports_enabled', $data['premium_analytics'] );
		$this->assertFalse( $data['premium_analytics']['client_side_csv_exports_enabled'] );
	}

	public function test_script_data_enables_client_side_csv_exports_via_filter() {
		add_filter( CLIENT_SIDE_CSV_EXPORTS_ENABLED_FILTER, '__return_true' );

		$data = inject_client_side_csv_exports_script_data( array() );

		$this->assertTrue( $data['premium_analytics']['client_side_csv_exports_enabled'] );
	}

	public function test_configure_registers_script_data_filter() {
		configure_client_side_csv_exports();

		$this->assertNotFalse(
			has_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_client_side_csv_exports_script_data' )
		);
	}
}
