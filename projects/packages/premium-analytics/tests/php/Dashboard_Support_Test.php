<?php
/**
 * Tests for the dashboard support entry point.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;

/**
 * Tests for Dashboard_Support. Isolated: its files load through require_once and hook at
 * file scope, so an earlier test that loaded them would satisfy every assertion.
 *
 * @covers \Automattic\Jetpack\PremiumAnalytics\Dashboard_Support
 */
#[CoversClass( Dashboard_Support::class )]
class Dashboard_Support_Test extends TestCase {

	/**
	 * Point the entry at the fixture module registration, which records that it ran.
	 */
	private function use_fixture_modules() {
		$property = new \ReflectionProperty( Dashboard_Support::class, 'modules_entry' );
		if ( PHP_VERSION_ID < 80500 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, __DIR__ . '/fixtures/build-entry/modules.php' );
	}

	/**
	 * A host that calls only this entry gets the dashboard API, the shared modules and the SDK alias.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_load_gives_a_host_the_dashboard_api_and_the_shared_modules() {
		$this->use_fixture_modules();

		Dashboard_Support::load();

		$this->assertTrue( function_exists( __NAMESPACE__ . '\\ensure_widget_registry_ready' ), 'The widget module readers are loaded.' );
		$this->assertTrue( function_exists( __NAMESPACE__ . '\\get_dashboard_default_widget_instance' ), 'The layout primitives are loaded.' );
		$this->assertTrue( function_exists( __NAMESPACE__ . '\\register_dashboard_section' ), 'The section API is loaded.' );
		$this->assertArrayHasKey( 'jpa_test_modules_loaded', $GLOBALS, 'The shared script modules are registered.' );
		$this->assertSame(
			20,
			has_action( 'wp_default_scripts', __NAMESPACE__ . '\\register_sdk_script_module' ),
			'The SDK alias registers after the shared modules.'
		);
	}

	/**
	 * The entry boots nothing of Stats v2: no menu, no REST routes, no Stats links, no data proxy.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_load_boots_nothing_of_stats_v2() {
		$this->use_fixture_modules();

		Dashboard_Support::load();

		$this->assertFalse( Analytics::is_initialized(), 'Stats v2 is not reported as booted.' );
		$this->assertFalse( has_action( 'admin_menu', array( Analytics::class, 'register_admin_menu' ) ), 'The Stats v2 menu is not registered.' );
		$this->assertFalse( has_action( 'rest_api_init', array( Dashboard_Support_Routes::class, 'boot_routes' ) ), 'The REST support routes stay with their own entry.' );
		$this->assertFalse( has_filter( 'jetpack_stats_url', array( Stats_Links::class, 'filter_url' ) ), 'The Stats links are not claimed.' );
		$this->assertFalse( has_filter( 'jetpack_stats_transient_cleanup_prefixes' ), 'The data proxy is not registered.' );
	}
}
