<?php
/**
 * Tests for the WooCommerce registrants on a request that never loads the dashboard's widget types file.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;
use function Automattic\Jetpack\PremiumAnalytics\get_registered_dashboard_section;
use const Automattic\Jetpack\PremiumAnalytics\DASHBOARD_NAME;

// The sections REST route loads these and not widget-types.php, so WIDGET_API_VERSION is undefined.
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/class-capabilities.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/class-enablement-setting.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/dashboard-sections.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/default-dashboard-sections.php';

/**
 * Without the widget contract version, the section still registers.
 *
 * Each test runs in its own process: the other test files define the constant for the whole run.
 *
 * @covers \Automattic\Jetpack\WooCommerceStats\Analytics_Dashboard
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[CoversClass( Analytics_Dashboard::class )]
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Analytics_Dashboard_Without_Widget_Types_Test extends BaseTestCase {

	/**
	 * The section registers on the sections route, which never loads the widget contract.
	 */
	public function test_the_section_registers_without_the_widget_contract_version() {
		$this->assertFalse( defined( 'Automattic\\Jetpack\\PremiumAnalytics\\WIDGET_API_VERSION' ) );

		Analytics_Dashboard::init();

		$this->assertNotNull( get_registered_dashboard_section( DASHBOARD_NAME, Analytics_Dashboard::SECTION_ID ) );
	}
}
