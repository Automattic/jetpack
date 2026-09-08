<?php
/**
 * Tests for the wp-build gating on the My Jetpack admin page.
 *
 * @package automattic/jetpack-my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;

/**
 * Covers the modernization flag and the request-scoping helpers.
 */
class Initializer_Wp_Build_Test extends BaseTestCase {

	/**
	 * Reset the request between tests.
	 *
	 * @return void
	 */
	public function tear_down() {
		unset( $_GET['page'], $_GET['step'] );
	}

	/**
	 * The flag is off unless a host opts in.
	 *
	 * @return void
	 */
	public function test_modernization_is_off_by_default() {
		$this->assertFalse( Initializer::is_modernized() );
	}

	/**
	 * Hosts can opt in through the documented filter.
	 *
	 * @return void
	 */
	public function test_modernization_filter_turns_it_on() {
		add_filter( Initializer::MODERNIZATION_FILTER, '__return_true' );

		$this->assertTrue( Initializer::is_modernized() );

		remove_filter( Initializer::MODERNIZATION_FILTER, '__return_true' );
	}

	/**
	 * Only `?page=my-jetpack` requests load wp-build.
	 *
	 * @return void
	 */
	public function test_request_scoping() {
		$this->assertFalse( Initializer::is_my_jetpack_admin_request() );

		$_GET['page'] = 'jetpack';
		$this->assertFalse( Initializer::is_my_jetpack_admin_request() );

		$_GET['page'] = 'my-jetpack';
		$this->assertTrue( Initializer::is_my_jetpack_admin_request() );
	}

	/**
	 * The onboarding takeover is excluded from wp-build.
	 *
	 * @return void
	 */
	public function test_onboarding_request_detection() {
		$_GET['page'] = 'my-jetpack';
		$this->assertFalse( Initializer::is_onboarding_request() );

		$_GET['step'] = 'onboarding';
		$this->assertTrue( Initializer::is_onboarding_request() );
	}

	/**
	 * The screen alias satisfies wp-build's enqueue check without changing the URL.
	 *
	 * @return void
	 */
	public function test_alias_screen_id() {
		set_current_screen( 'jetpack_page_my-jetpack' );
		$screen = get_current_screen();

		Initializer::alias_screen_id_for_wp_build( $screen );

		$this->assertSame( 'my-jetpack-dashboard', $screen->id );
	}

	/**
	 * A non-object screen must not fatal. WordPress passes null on screens it
	 * cannot resolve, and the `current_screen` action still fires there.
	 *
	 * @return void
	 */
	public function test_alias_screen_id_ignores_null() {
		$this->expectNotToPerformAssertions();

		Initializer::alias_screen_id_for_wp_build( null );
	}

	/**
	 * Register stubs for the legacy bundle's build-time dependencies.
	 *
	 * WordPress notices when a script is enqueued against unregistered
	 * dependencies, and `failOnNotice` turns that into a failure. The list comes
	 * from the built asset file, so read it rather than hard-coding it — an
	 * unbuilt checkout (CI) declares none.
	 *
	 * @return void
	 */
	private function stub_legacy_bundle_dependencies() {
		$asset_file = dirname( __DIR__, 2 ) . '/build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		foreach ( $asset['dependencies'] ?? array() as $dependency ) {
			if ( ! wp_script_is( $dependency, 'registered' ) ) {
				wp_register_script( $dependency, 'https://example.org/' . $dependency . '.js', array(), '1.0.0', true );
			}
		}
	}

	/**
	 * With the flag off, every site keeps the legacy bundle. This is the safety
	 * property all nine bundling plugins depend on.
	 *
	 * Runs isolated: enqueue_scripts() makes a real is_connected() call, which sets
	 * a process-wide flag WorDBless teardown cannot reset (see Initializer_Test).
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @return void
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enqueue_scripts_registers_the_legacy_bundle_when_the_flag_is_off() {
		$_GET['page'] = 'my-jetpack';
		$this->stub_legacy_bundle_dependencies();

		Initializer::enqueue_scripts();

		$this->assertTrue( wp_script_is( 'my_jetpack_main_app', 'registered' ) );
		$this->assertFalse( wp_script_is( Initializer::DATA_SCRIPT_HANDLE, 'registered' ) );
	}

	/**
	 * A flag that turns on after the loader already ran must not cost the request
	 * its legacy bundle: wp-build is not loaded, so nothing would render.
	 *
	 * This is what the `function_exists()` term in enqueue_scripts() buys. Removing
	 * it must turn this test red. Boost reaches the same shape from its own page,
	 * where it declares `my_jetpack_main_app` a hard dependency of its dashboard.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @return void
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enqueue_scripts_keeps_the_legacy_bundle_when_wp_build_never_loaded() {
		$_GET['page'] = 'my-jetpack';
		$this->stub_legacy_bundle_dependencies();

		// The loader runs on admin_menu priority 1 — before this filter exists.
		Initializer::maybe_load_wp_build();
		add_filter( Initializer::MODERNIZATION_FILTER, '__return_true' );

		Initializer::enqueue_scripts();

		$this->assertTrue( wp_script_is( 'my_jetpack_main_app', 'registered' ) );
		$this->assertFalse( wp_script_is( Initializer::DATA_SCRIPT_HANDLE, 'registered' ) );
	}
}
