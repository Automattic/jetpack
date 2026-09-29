<?php
/**
 * Tests for the Top videos registrant on a request that never loads the dashboard's widget types file.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\PremiumAnalytics\Widget_Type_Registry;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;

// The sections REST route loads these and not widget-types.php, so WIDGET_API_VERSION is undefined.
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/class-capabilities.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/class-enablement-setting.php';
require_once __DIR__ . '/../../vendor/automattic/jetpack-premium-analytics/src/dashboard-sections.php';
require_once __DIR__ . '/mocks/analytics-dashboard-manifest-fixture.php';

/**
 * Without the widget contract version, the widget type waits and the layout seed still lands: the
 * dashboard drops it itself on a site where the type never registers.
 *
 * Each test runs in its own process: the other test files define the constant for the whole run.
 *
 * @covers \Automattic\Jetpack\VideoPress\Analytics_Dashboard
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[CoversClass( Analytics_Dashboard::class )]
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Analytics_Dashboard_Without_Widget_Types_Test extends BaseTestCase {

	public function set_up() {
		parent::set_up();
		add_filter( Analytics_Dashboard::WIDGET_MANIFEST_FILTER, 'jetpack_videopress_test_widget_manifest' );
	}

	public function test_the_widget_type_waits_for_the_widget_contract_version() {
		$this->assertFalse( defined( 'Automattic\\Jetpack\\PremiumAnalytics\\WIDGET_API_VERSION' ) );
		$registry = new Widget_Type_Registry();

		Analytics_Dashboard::register_widget_types( $registry );

		$this->assertSame( array(), $registry->get_all_registered() );
	}

	public function test_the_layout_seed_does_not_wait() {
		$this->assertFalse( defined( 'Automattic\\Jetpack\\PremiumAnalytics\\WIDGET_API_VERSION' ) );

		$layout = Analytics_Dashboard::add_default_layout_instance( array(), Analytics_Dashboard::TRAFFIC_SECTION_ID );

		$this->assertSame( array( Analytics_Dashboard::TOP_VIDEOS_TYPE ), array_column( $layout, 'type' ) );
	}
}
