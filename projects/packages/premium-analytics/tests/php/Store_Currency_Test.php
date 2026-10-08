<?php
/**
 * Tests for store currency script data.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../../src/store-currency.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_store_currency_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_store_currency_script_data' )]
class Store_Currency_Test extends TestCase {

	public function test_script_data_is_unchanged_without_woocommerce() {
		$data = array( 'premium_analytics' => array( 'csv_exports_enabled' => true ) );

		$this->assertSame( $data, inject_store_currency_script_data( $data ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_script_data_adds_the_store_currency_beside_existing_keys() {
		require_once __DIR__ . '/mocks/woocommerce-currency-mock.php';

		$data = inject_store_currency_script_data(
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
