<?php
/**
 * Tests for the widget types registrant on a dashboard whose widget contract the widgets cannot run on.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use Automattic\Jetpack\PremiumAnalytics\Widget_Type_Registry;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;

/**
 * The widgets are built for the 2.x contract, so they register on that major from 2.0.0 on.
 *
 * Each case runs in its own process: the contract version is a constant.
 *
 * @covers \Automattic\Jetpack\WooCommerceStats\Analytics_Dashboard
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[CoversClass( Analytics_Dashboard::class )]
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Analytics_Dashboard_Widget_Contract_Test extends BaseTestCase {

	/**
	 * @dataProvider unsupported_contract_versions
	 *
	 * @param string|null $version The contract version the dashboard declares, or null for none.
	 */
	#[DataProvider( 'unsupported_contract_versions' )]
	public function test_the_widget_types_wait_for_a_contract_they_run_on( $version ) {
		if ( null !== $version ) {
			define( 'Automattic\\Jetpack\\PremiumAnalytics\\WIDGET_API_VERSION', $version );
		}
		// WooCommerce and the reader are satisfied, so the contract alone decides.
		add_filter( Analytics_Dashboard::WOOCOMMERCE_AVAILABLE_FILTER, '__return_true' );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'contract_admin_' . wp_rand(),
					'user_pass'  => 'password',
					'role'       => 'administrator',
				)
			)
		);
		$registry = new Widget_Type_Registry();

		Analytics_Dashboard::register_widget_types( $registry );

		$this->assertSame( array(), $registry->get_all_registered() );
	}

	/**
	 * Contract versions the widgets were not built against.
	 *
	 * @return array[]
	 */
	public static function unsupported_contract_versions() {
		return array(
			'no version yet: the widget types file has not loaded' => array( null ),
			'the contract before useReport'             => array( '1.3.0' ),
			'the contract before Donut'                 => array( '1.4.0' ),
			'the contract before the icon resolver'     => array( '1.5.0' ),
			'the contract before the bars variant'      => array( '1.6.0' ),
			'the contract before the half-ring variant' => array( '1.7.0' ),
			'the contract before Funnel'                => array( '1.8.0' ),
			'the contract before Columns'               => array( '1.9.0' ),
			'the contract before Locations'             => array( '1.10.0' ),
			'the previous major'                        => array( '1.16.0' ),
			'the next major'                            => array( '3.0.0' ),
		);
	}
}
