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
	 * The alias only has to hold for wp-build's enqueue check.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @return void
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_alias_screen_id_ends_after_the_wp_build_enqueue_check() {
		set_current_screen( 'jetpack_page_my-jetpack' );
		Initializer::alias_screen_id_for_wp_build( get_current_screen() );

		// Stands in for the generated check, which hooks the default priority.
		$id_during_enqueue = null;
		add_action(
			'admin_enqueue_scripts',
			static function () use ( &$id_during_enqueue ) {
				$id_during_enqueue = get_current_screen()->id;
			}
		);

		do_action( 'admin_enqueue_scripts', 'jetpack_page_my-jetpack' );

		$this->assertSame( 'my-jetpack-dashboard', $id_during_enqueue );
		$this->assertSame( 'jetpack_page_my-jetpack', get_current_screen()->id );
	}

	/**
	 * Stub the built bundle's dependencies, or `failOnNotice` fails the enqueue.
	 *
	 * Unbuilt checkouts (CI) declare none.
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
	 * property every bundling plugin depends on.
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
	 * A flag added after admin_menu must not cost the request its legacy bundle;
	 * Boost depends on that handle.
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

	/**
	 * With wp-build loaded, the three state payloads have to move to the data handle —
	 * the app is a script module there, so the legacy handle never gets printed.
	 *
	 * Stubs the render function rather than requiring a built checkout, so this covers
	 * the branch on CI too.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @return void
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enqueue_scripts_moves_the_state_to_the_data_handle_when_wp_build_loaded() {
		$_GET['page'] = 'my-jetpack';
		add_filter( Initializer::MODERNIZATION_FILTER, '__return_true' );

		// Stands in for the generated build/pages/ render function the flag-on path gates on.
		require_once __DIR__ . '/stubs/wp-build-render-page.php';

		wp_register_script( 'wp-jp-i18n-loader', 'https://example.org/i18n.js', array(), '1.0.0', true );

		Initializer::enqueue_scripts();

		$this->assertTrue( wp_script_is( Initializer::DATA_SCRIPT_HANDLE, 'registered' ) );
		$this->assertFalse( wp_script_is( 'my_jetpack_main_app', 'registered' ) );

		// The esbuild bundles don't depend on the loader, so it needs enqueueing by hand.
		$this->assertTrue( wp_script_is( 'wp-jp-i18n-loader', 'enqueued' ) );

		// wp_localize_script() writes to `data`; Connection_Initial_State uses an inline `before`.
		$localized = wp_scripts()->get_data( Initializer::DATA_SCRIPT_HANDLE, 'data' );
		$this->assertStringContainsString( 'myJetpackInitialState', $localized );
		$this->assertStringContainsString( 'myJetpackRest', $localized );

		$before = implode( '', (array) wp_scripts()->get_data( Initializer::DATA_SCRIPT_HANDLE, 'before' ) );
		$this->assertStringContainsString( 'JP_CONNECTION_INITIAL_STATE', $before );
	}
}
