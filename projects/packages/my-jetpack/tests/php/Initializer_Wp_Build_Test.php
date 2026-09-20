<?php
/**
 * Tests for serving the My Jetpack admin page through wp-build.
 *
 * @package automattic/jetpack-my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;

/**
 * Covers the request-scoping helpers and what each kind of request renders and enqueues.
 */
class Initializer_Wp_Build_Test extends BaseTestCase {

	/**
	 * Per-flag filter that forces the Features tab flag.
	 */
	const FEATURES_TAB_FLAG_FILTER = 'jetpack_feature_flag_enabled_' . Initializer::FEATURES_TAB_FEATURE_FLAG;

	/**
	 * Reset the request between tests.
	 *
	 * @return void
	 */
	public function tear_down() {
		unset( $_GET['page'], $_GET['step'], $GLOBALS['current_screen'] );
		remove_all_filters( self::FEATURES_TAB_FLAG_FILTER );
		remove_all_filters( 'jetpack_my_jetpack_should_initialize' );
		Feature_Flags::reset();
	}

	/**
	 * The Features tab is off unless its flag is on.
	 *
	 * @return void
	 */
	public function test_features_tab_follows_its_flag() {
		Initializer::register_feature_flags();

		$this->assertFalse( Initializer::is_features_tab_enabled() );
		$this->assertNull( Initializer::get_products_section() );

		add_filter( self::FEATURES_TAB_FLAG_FILTER, '__return_true' );
		$this->assertTrue( Initializer::is_features_tab_enabled() );
		$this->assertSame(
			array(
				'slug'  => 'features',
				'label' => 'Features',
			),
			Initializer::get_products_section()
		);
	}

	/**
	 * The flag is registered even where My Jetpack itself is off, so it stays listed.
	 *
	 * @return void
	 */
	public function test_init_registers_the_flag_where_my_jetpack_is_off() {
		add_filter( 'jetpack_my_jetpack_should_initialize', '__return_false' );

		Initializer::init();

		$this->assertFalse( Initializer::should_initialize() );
		$this->assertNotNull( Feature_Flags::get( Initializer::FEATURES_TAB_FEATURE_FLAG ) );
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
	 * Only the My Jetpack dashboard request loads wp-build, and with it the polyfills.
	 *
	 * @return void
	 */
	public function test_should_load_wp_build_is_scoped_to_the_dashboard_request() {
		$_GET['page'] = 'my-jetpack';
		$this->assertTrue( Initializer::should_load_wp_build(), 'Dashboard request.' );

		$_GET['page'] = 'jetpack';
		$this->assertFalse( Initializer::should_load_wp_build(), 'Another admin page.' );

		$_GET['page'] = 'my-jetpack';
		$_GET['step'] = 'onboarding';
		$this->assertFalse( Initializer::should_load_wp_build(), 'Onboarding takeover.' );
	}

	/**
	 * The alias and its restore pair up, and do nothing without a screen.
	 *
	 * @return void
	 */
	public function test_alias_screen_id_round_trip() {
		Initializer::alias_screen_id_for_wp_build();
		Initializer::restore_screen_id_after_wp_build();

		set_current_screen( 'jetpack_page_my-jetpack' );

		Initializer::alias_screen_id_for_wp_build();
		$this->assertSame( Initializer::WP_BUILD_PAGE_ID, get_current_screen()->id );

		Initializer::restore_screen_id_after_wp_build();
		$this->assertSame( 'jetpack_page_my-jetpack', get_current_screen()->id );
	}

	/**
	 * The alias holds for the generated enqueue check only, not for the callbacks around it.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @return void
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_load_wp_build_aliases_the_screen_only_for_the_generated_check() {
		set_current_screen( 'jetpack_page_my-jetpack' );

		$id_before = null;
		add_action(
			'admin_enqueue_scripts',
			static function () use ( &$id_before ) {
				$id_before = get_current_screen()->id;
			}
		);

		Initializer::load_wp_build( __DIR__ . '/stubs/wp-build-index.php' );

		$id_after = null;
		add_action(
			'admin_enqueue_scripts',
			static function () use ( &$id_after ) {
				$id_after = get_current_screen()->id;
			}
		);

		do_action( 'admin_enqueue_scripts', 'jetpack_page_my-jetpack' );

		$this->assertSame( Initializer::WP_BUILD_PAGE_ID, $GLOBALS['my_jetpack_test_wp_build_check_screen_id'] );
		$this->assertSame( 'jetpack_page_my-jetpack', $id_before );
		$this->assertSame( 'jetpack_page_my-jetpack', $id_after );
	}

	/**
	 * The dashboard hands off to the wp-build render function.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @return void
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_page_renders_through_wp_build_when_loaded() {
		require_once __DIR__ . '/stubs/wp-build-render-page.php';

		$html = $this->render_admin_page();

		$this->assertStringContainsString( 'id="my-jetpack-dashboard-wp-admin-app"', $html );
		$this->assertStringNotContainsString( 'my-jetpack-container', $html );
	}

	/**
	 * An unbuilt checkout has no render function to call, and must not fatal.
	 *
	 * @return void
	 */
	public function test_admin_page_renders_nothing_without_the_wp_build_output() {
		$this->assertSame( '', $this->render_admin_page() );
	}

	/**
	 * Onboarding renders its own container even where wp-build is loaded.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @return void
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_admin_page_renders_the_onboarding_container_for_the_takeover() {
		require_once __DIR__ . '/stubs/wp-build-render-page.php';
		$_GET['step'] = 'onboarding';

		$html = $this->render_admin_page();

		$this->assertStringContainsString( 'id="my-jetpack-container"', $html );
		$this->assertStringNotContainsString( 'my-jetpack-dashboard-wp-admin-app', $html );
	}

	/**
	 * Capture the admin page's markup.
	 *
	 * @return string
	 */
	private function render_admin_page() {
		ob_start();
		Initializer::admin_page();
		return (string) ob_get_clean();
	}

	/**
	 * Stub the onboarding bundle's dependencies, or `failOnNotice` fails the enqueue.
	 *
	 * Unbuilt checkouts (CI) declare none.
	 *
	 * @return void
	 */
	private function stub_onboarding_bundle_dependencies() {
		$asset_file = dirname( __DIR__, 2 ) . '/build/onboarding.asset.php';

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
	 * Assert the three state payloads landed on the script-less data handle.
	 *
	 * @return void
	 */
	private function assert_state_is_on_the_data_handle() {
		$this->assertTrue( wp_script_is( Initializer::DATA_SCRIPT_HANDLE, 'enqueued' ) );
		$this->assertFalse( wp_scripts()->registered[ Initializer::DATA_SCRIPT_HANDLE ]->src );

		// wp_localize_script() writes to `data`; Connection_Initial_State uses an inline `before`.
		$localized = wp_scripts()->get_data( Initializer::DATA_SCRIPT_HANDLE, 'data' );
		$this->assertStringContainsString( 'myJetpackInitialState', $localized );
		$this->assertStringContainsString( 'myJetpackRest', $localized );

		$before = implode( '', (array) wp_scripts()->get_data( Initializer::DATA_SCRIPT_HANDLE, 'before' ) );
		$this->assertStringContainsString( 'JP_CONNECTION_INITIAL_STATE', $before );
	}

	/**
	 * The dashboard is a script module, so its state goes on a data handle with no bundle behind it.
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
	public function test_enqueue_scripts_puts_the_dashboard_state_on_the_data_handle() {
		$_GET['page'] = 'my-jetpack';

		// Stands in for the generated build/pages/ render function the dashboard gates on.
		require_once __DIR__ . '/stubs/wp-build-render-page.php';

		wp_register_script( 'wp-jp-i18n-loader', 'https://example.org/i18n.js', array(), '1.0.0', true );

		Initializer::enqueue_scripts();

		$this->assert_state_is_on_the_data_handle();
		$this->assertFalse( wp_script_is( Initializer::ONBOARDING_SCRIPT_HANDLE, 'registered' ) );

		// The esbuild bundles don't depend on the loader, so it needs enqueueing by hand.
		$this->assertTrue( wp_script_is( 'wp-jp-i18n-loader', 'enqueued' ) );
	}

	/**
	 * Onboarding loads its webpack bundle after the state it reads.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @return void
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enqueue_scripts_loads_the_onboarding_bundle_for_the_takeover() {
		$_GET['page'] = 'my-jetpack';
		$_GET['step'] = 'onboarding';
		$this->stub_onboarding_bundle_dependencies();

		Initializer::enqueue_scripts();

		$this->assert_state_is_on_the_data_handle();
		$this->assertTrue( wp_script_is( Initializer::ONBOARDING_SCRIPT_HANDLE, 'enqueued' ) );
		$this->assertContains(
			Initializer::DATA_SCRIPT_HANDLE,
			wp_scripts()->registered[ Initializer::ONBOARDING_SCRIPT_HANDLE ]->deps
		);
	}

	/**
	 * Boost calls enqueue_scripts() on its own page and depends on the data handle by name.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @return void
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enqueue_scripts_prints_only_the_state_on_another_plugins_page() {
		$_GET['page'] = 'jetpack-boost';
		$_GET['step'] = 'onboarding';

		Initializer::enqueue_scripts();

		$this->assertSame( 'my_jetpack_main_app', Initializer::DATA_SCRIPT_HANDLE );
		$this->assert_state_is_on_the_data_handle();
		$this->assertFalse( wp_script_is( Initializer::ONBOARDING_SCRIPT_HANDLE, 'registered' ) );
	}
}
