<?php
/**
 * My Jetpack's calls against a Protect product that predates has_protect_page().
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\My_Jetpack\Products\Protect;
use Automattic\Jetpack\My_Jetpack\Products\Scan;
use Automattic\Jetpack\Redirect;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

/**
 * Separate processes let the stub load before the autoloader reaches the real Protect.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Older_Protect_Test extends TestCase {

	/**
	 * Loads the older Protect in place of the real one.
	 */
	public function setUp(): void {
		parent::setUp();

		require_once __DIR__ . '/stubs/older-protect/class-protect.php';
		// @phan-suppress-next-line PhanUndeclaredStaticProperty -- Declared by the stub, which Phan excludes.
		Protect::$standalone_plugin_active = true;
		$this->assertFalse( method_exists( Protect::class, 'has_protect_page' ) );
	}

	public function test_scan_manage_url_stays_on_jetpack_cloud() {
		// An initialized dashboard must not change Scan's URL when the older Protect class is loaded.
		do_action( 'jetpack_protect_dashboard_initialized' );

		$this->assertSame( Redirect::get_url( 'my-jetpack-manage-scan' ), Scan::get_manage_url() );
	}

	public function test_async_badge_skips_threats_while_the_standalone_plugin_counts_them() {
		Initializer::enqueue_red_bubble_script();

		$this->assertStringContainsString( '"excludedAlerts":["protect_has_threats"]', (string) wp_scripts()->get_data( 'my-jetpack-notification-bubble', 'data' ) );
	}

	public function test_async_badge_keeps_threats_when_the_standalone_plugin_is_inactive() {
		// @phan-suppress-next-line PhanUndeclaredStaticProperty -- Declared by the stub, which Phan excludes.
		Protect::$standalone_plugin_active = false;

		Initializer::enqueue_red_bubble_script();

		$this->assertStringContainsString( '"excludedAlerts":[]', (string) wp_scripts()->get_data( 'my-jetpack-notification-bubble', 'data' ) );
	}
}
