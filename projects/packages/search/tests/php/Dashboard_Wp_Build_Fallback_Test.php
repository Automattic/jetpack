<?php
/**
 * Tests for the Dashboard class's wp-build fallback.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\Search\TestCase as Search_TestCase;
use PHPUnit\Framework\Attributes\CoversClass;
use ReflectionMethod;

require_once __DIR__ . '/fixtures/wp-build-render.php';

/**
 * Both render() and load_admin_scripts() read is_wp_build_dashboard_active(), so a
 * modernization flag switched on without a wp-build build present falls back to the
 * legacy dashboard coherently instead of half-way. See #51436, which broke Backup
 * this way when its equivalent call sites gated independently.
 *
 * @covers \Automattic\Jetpack\Search\Dashboard
 */
#[CoversClass( Dashboard::class )]
class Dashboard_Wp_Build_Fallback_Test extends Search_TestCase {

	/**
	 * Per-flag filter that forces the wp-build branch on.
	 */
	const FLAG_FILTER = 'jetpack_feature_flag_enabled_' . Dashboard::WP_BUILD_FEATURE_FLAG;

	/**
	 * Register the package's flags, as Initializer::init() does on a real request.
	 */
	public function setUp(): void {
		parent::setUp();
		Dashboard::register_feature_flags();
	}

	/**
	 * Reset what the tested methods read or write.
	 */
	public function tearDown(): void {
		remove_all_filters( self::FLAG_FILTER );
		// The registry is private static, so a flag registered here would outlive the class.
		Feature_Flags::reset();
		wp_dequeue_script( Dashboard::DATA_SCRIPT_HANDLE );
		wp_deregister_script( Dashboard::DATA_SCRIPT_HANDLE );
		wp_dequeue_script( 'jp-search-dashboard' );
		wp_deregister_script( 'jp-search-dashboard' );

		parent::tearDown();
	}

	/**
	 * Call the protected predicate.
	 *
	 * @param Dashboard $dashboard Instance under test.
	 * @return bool
	 */
	private function is_wp_build_dashboard_active( Dashboard $dashboard ) {
		$method = new ReflectionMethod( Dashboard::class, 'is_wp_build_dashboard_active' );
		if ( \PHP_VERSION_ID < 80100 ) {
			// Required to invoke non-public methods before PHP 8.1; deprecated no-op since PHP 8.5.
			$method->setAccessible( true );
		}

		return $method->invoke( $dashboard );
	}

	/**
	 * A Dashboard whose render-function seam points at the fixture, so the wp-build
	 * branch is reachable without building the package.
	 *
	 * @return Dashboard
	 */
	private function dashboard_with_build() {
		return new class() extends Dashboard {
			/**
			 * @return string
			 */
			protected function wp_build_render_function() {
				return 'Automattic\\Jetpack\\Search\\Fixtures\\wp_build_render_page';
			}
		};
	}

	public function test_predicate_is_false_when_the_flag_is_off() {
		$this->assertFalse( $this->is_wp_build_dashboard_active( new Dashboard() ) );
	}

	public function test_predicate_stays_false_when_the_flag_is_on_but_the_build_is_absent() {
		add_filter( self::FLAG_FILTER, '__return_true' );

		// The wp-build render function only exists once `pnpm build` has run, which this
		// test environment never does — so the predicate must fall back on its own.
		$this->assertFalse( $this->is_wp_build_dashboard_active( new Dashboard() ) );
	}

	public function test_render_falls_back_to_the_legacy_markup_when_the_flag_is_off() {
		ob_start();
		( new Dashboard() )->render();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'id="jp-search-dashboard"', $output );
	}

	public function test_render_falls_back_to_the_legacy_markup_when_the_build_is_absent() {
		add_filter( self::FLAG_FILTER, '__return_true' );

		ob_start();
		( new Dashboard() )->render();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'id="jp-search-dashboard"', $output );
	}

	public function test_load_admin_scripts_registers_the_legacy_script_when_the_flag_is_off() {
		( new Dashboard() )->load_admin_scripts();

		$this->assertTrue( wp_script_is( 'jp-search-dashboard', 'registered' ) );
		$this->assertFalse( wp_script_is( Dashboard::DATA_SCRIPT_HANDLE, 'registered' ) );
	}

	public function test_load_admin_scripts_registers_the_legacy_script_when_the_build_is_absent() {
		add_filter( self::FLAG_FILTER, '__return_true' );

		( new Dashboard() )->load_admin_scripts();

		$this->assertTrue( wp_script_is( 'jp-search-dashboard', 'registered' ) );
		$this->assertFalse( wp_script_is( Dashboard::DATA_SCRIPT_HANDLE, 'registered' ) );
	}

	public function test_render_calls_the_generated_function_when_the_build_is_present() {
		add_filter( self::FLAG_FILTER, '__return_true' );

		ob_start();
		$this->dashboard_with_build()->render();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'id="jetpack-search-dashboard-wp-admin-app"', $output );
		$this->assertStringNotContainsString( 'id="jp-search-dashboard"', $output );
	}

	public function test_render_stays_legacy_with_a_build_present_but_the_flag_off() {
		ob_start();
		$this->dashboard_with_build()->render();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'id="jp-search-dashboard"', $output );
	}

	public function test_load_admin_scripts_swaps_the_data_handle_when_the_build_is_present() {
		add_filter( self::FLAG_FILTER, '__return_true' );

		$this->dashboard_with_build()->load_admin_scripts();

		$this->assertTrue( wp_script_is( Dashboard::DATA_SCRIPT_HANDLE, 'registered' ) );
		$this->assertFalse( wp_script_is( 'jp-search-dashboard', 'registered' ) );
	}

	public function test_initial_state_rides_the_data_handle_on_the_wp_build_path() {
		add_filter( self::FLAG_FILTER, '__return_true' );

		$this->dashboard_with_build()->load_admin_scripts();

		$inline = implode( "\n", array_filter( (array) wp_scripts()->get_data( Dashboard::DATA_SCRIPT_HANDLE, 'before' ) ) );
		$this->assertStringContainsString( 'JP_CONNECTION_INITIAL_STATE', $inline );
	}

	public function test_the_constant_matches_the_generated_function_name() {
		$generated = dirname( __DIR__, 2 ) . '/build/pages/jetpack-search-dashboard/page-wp-admin.php';
		if ( ! file_exists( $generated ) ) {
			$this->markTestSkipped( 'Package is not built; nothing to compare the constant against.' );
		}

		$this->assertStringContainsString(
			'function ' . Dashboard::WP_BUILD_RENDER_FN . '(',
			(string) file_get_contents( $generated ),
			'A page-slug or wpPlugin.name change renamed the generated function; every site would silently get the legacy dashboard.'
		);
	}
}
