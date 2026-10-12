<?php
/**
 * Tests for the store currency script data.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\WooCommerceStats\Store_Currency
 */
#[CoversClass( Store_Currency::class )]
class Store_Currency_Test extends TestCase {

	public function test_script_data_is_unchanged_without_woocommerce() {
		$data = array( 'premium_analytics' => array( 'csv_exports_enabled' => true ) );

		$this->assertSame( $data, Store_Currency::add_script_data( $data ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_script_data_adds_the_store_currency_beside_existing_keys() {
		require_once __DIR__ . '/mocks/woocommerce-currency-mock.php';

		$data = Store_Currency::add_script_data(
			array( 'premium_analytics' => array( 'csv_exports_enabled' => true ) )
		);

		$this->assertTrue( $data['premium_analytics']['csv_exports_enabled'] );
		$this->assertSame(
			array(
				'code'   => 'EUR',
				'symbol' => '€',
			),
			$data['premium_analytics']['store_currency']
		);
	}
}
