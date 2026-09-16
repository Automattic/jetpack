<?php
/**
 * Tests for the Dashboard class's wp-build fallback.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;
use PHPUnit\Framework\Attributes\CoversClass;
use ReflectionMethod;

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
	 * Reset what the tested methods read or write.
	 */
	public function tearDown(): void {
		remove_all_filters( Dashboard::MODERNIZATION_FILTER );
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

	public function test_predicate_is_false_when_the_filter_is_off() {
		$this->assertFalse( $this->is_wp_build_dashboard_active( new Dashboard() ) );
	}

	public function test_predicate_stays_false_when_the_filter_is_on_but_the_build_is_absent() {
		add_filter( Dashboard::MODERNIZATION_FILTER, '__return_true' );

		// The wp-build render function only exists once `pnpm build` has run, which this
		// test environment never does — so the predicate must fall back on its own.
		$this->assertFalse( $this->is_wp_build_dashboard_active( new Dashboard() ) );
	}

	public function test_render_falls_back_to_the_legacy_markup_when_the_filter_is_off() {
		ob_start();
		( new Dashboard() )->render();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'id="jp-search-dashboard"', $output );
	}

	public function test_render_falls_back_to_the_legacy_markup_when_the_build_is_absent() {
		add_filter( Dashboard::MODERNIZATION_FILTER, '__return_true' );

		ob_start();
		( new Dashboard() )->render();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'id="jp-search-dashboard"', $output );
	}

	public function test_load_admin_scripts_registers_the_legacy_script_when_the_filter_is_off() {
		( new Dashboard() )->load_admin_scripts();

		$this->assertTrue( wp_script_is( 'jp-search-dashboard', 'registered' ) );
		$this->assertFalse( wp_script_is( Dashboard::DATA_SCRIPT_HANDLE, 'registered' ) );
	}

	public function test_load_admin_scripts_registers_the_legacy_script_when_the_build_is_absent() {
		add_filter( Dashboard::MODERNIZATION_FILTER, '__return_true' );

		( new Dashboard() )->load_admin_scripts();

		$this->assertTrue( wp_script_is( 'jp-search-dashboard', 'registered' ) );
		$this->assertFalse( wp_script_is( Dashboard::DATA_SCRIPT_HANDLE, 'registered' ) );
	}
}
