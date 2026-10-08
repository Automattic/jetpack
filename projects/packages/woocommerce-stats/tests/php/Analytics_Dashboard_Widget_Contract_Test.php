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
 * The widgets import names the SDK gained in 1.4.0, so they register on that major from there on.
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
			'the contract before useReport' => array( '1.3.0' ),
			'the next major'                => array( '2.0.0' ),
		);
	}
}
