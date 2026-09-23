<?php
/**
 * Tests for the Dashboard class's wp-build rendering.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\TestCase as Search_TestCase;
use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/fixtures/wp-build-render.php';

/**
 * Tests the dashboard's wp-build rendering and script data.
 *
 * @covers \Automattic\Jetpack\Search\Dashboard
 */
#[CoversClass( Dashboard::class )]
class Dashboard_Wp_Build_Test extends Search_TestCase {

	/**
	 * Reset what the tested methods write.
	 */
	public function tearDown(): void {
		wp_dequeue_script( Dashboard::DATA_SCRIPT_HANDLE );
		wp_deregister_script( Dashboard::DATA_SCRIPT_HANDLE );

		parent::tearDown();
	}

	/**
	 * A Dashboard whose render-function seam points at the fixture, so the generated
	 * page is reachable without building the package.
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

	public function test_render_calls_the_generated_function_when_the_build_is_present() {
		ob_start();
		$this->dashboard_with_build()->render();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'id="jetpack-search-dashboard-wp-admin-app"', $output );
	}

	public function test_render_prints_nothing_when_the_build_is_not_loaded() {
		// Nothing here loads build/build.php, so the generated render function is undefined.
		ob_start();
		( new Dashboard() )->render();
		$output = ob_get_clean();

		$this->assertSame( '', $output );
	}

	public function test_load_admin_scripts_enqueues_the_data_handle() {
		( new Dashboard() )->load_admin_scripts();

		$this->assertTrue( wp_script_is( Dashboard::DATA_SCRIPT_HANDLE, 'enqueued' ) );
	}

	public function test_initial_state_rides_the_data_handle() {
		( new Dashboard() )->load_admin_scripts();

		$inline = implode( "\n", array_filter( (array) wp_scripts()->get_data( Dashboard::DATA_SCRIPT_HANDLE, 'before' ) ) );
		$this->assertStringContainsString( 'JP_CONNECTION_INITIAL_STATE', $inline );
	}

	public function test_the_constants_match_the_wp_build_page_definition() {
		$package_json = (array) json_decode( (string) file_get_contents( dirname( __DIR__, 2 ) . '/package.json' ), true );
		$wp_plugin    = (array) $package_json['wpPlugin'];
		$page         = (array) $wp_plugin['pages'][0];

		$this->assertSame( Dashboard::WP_BUILD_PAGE_ID, $page['id'] );
		$this->assertSame(
			Dashboard::WP_BUILD_RENDER_FN,
			$wp_plugin['name'] . '_' . str_replace( '-', '_', (string) $page['id'] ) . '_wp_admin_render_page',
			'A page-id or wpPlugin.name change renamed the generated function; the Search page would silently render blank.'
		);
	}

	public function test_the_constant_matches_the_name_the_generator_emitted() {
		$generated = dirname( __DIR__, 2 ) . '/build/pages/jetpack-search-dashboard/page-wp-admin.php';
		if ( ! file_exists( $generated ) ) {
			$this->markTestSkipped( 'Package is not built; the generated file is only present after a build.' );
		}

		$this->assertStringContainsString(
			'function ' . Dashboard::WP_BUILD_RENDER_FN . '(',
			(string) file_get_contents( $generated )
		);
	}
}
