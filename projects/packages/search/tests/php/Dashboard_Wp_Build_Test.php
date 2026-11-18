<?php
/**
 * Tests for the Dashboard class's wp-build rendering.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Admin_UI\Admin_Shell;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Search\TestCase as Search_TestCase;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

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
		remove_all_actions( 'admin_enqueue_scripts' );
		unset( $GLOBALS['jetpack_search_test_wp_build_check_screen_id'], $GLOBALS['current_screen'] );
		remove_filter( 'jetpack_options', array( $this, 'mock_site_connection_without_users' ), 11 );
		remove_filter( 'wp_doing_ajax', '__return_true' );
		unset( $_GET['action'] );
		( new Connection_Manager() )->reset_connection_status();

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

	/**
	 * A Dashboard on the Search page whose build-index seam points at the stub, so
	 * maybe_load_wp_build() runs without the package being built.
	 *
	 * @return Dashboard
	 */
	private function dashboard_on_the_search_page() {
		return new class() extends Dashboard {
			/**
			 * @return string
			 */
			protected function wp_build_index() {
				return __DIR__ . '/fixtures/wp-build-index.php';
			}

			/**
			 * @return bool
			 */
			protected function is_search_admin_request() {
				return true;
			}
		};
	}

	/**
	 * The generated enqueue check must see the aliased ID, and nothing hooked either
	 * side of it may. Fails if a hook is dropped or the two are hooked out of order.
	 */
	public function test_maybe_load_wp_build_aliases_the_screen_only_for_the_generated_check() {
		set_current_screen( 'jetpack_page_jetpack-search' );

		$id_before = null;
		add_action(
			'admin_enqueue_scripts',
			static function () use ( &$id_before ) {
				$id_before = get_current_screen()->id;
			}
		);

		$this->dashboard_on_the_search_page()->maybe_load_wp_build();

		$id_after = null;
		add_action(
			'admin_enqueue_scripts',
			static function () use ( &$id_after ) {
				$id_after = get_current_screen()->id;
			}
		);

		do_action( 'admin_enqueue_scripts', 'jetpack_page_jetpack-search' );

		$this->assertSame( Dashboard::WP_BUILD_PAGE_ID, $GLOBALS['jetpack_search_test_wp_build_check_screen_id'] );
		$this->assertSame( 'jetpack_page_jetpack-search', $id_before );
		$this->assertSame( 'jetpack_page_jetpack-search', $id_after );
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

	/**
	 * A menu hover readies the page through the admin shell, which must not create the purchase token.
	 *
	 * @dataProvider provide_page_loads
	 *
	 * @param bool $is_guest Whether the admin shell readies the page through its member loader.
	 * @param bool $is_hover Whether this is the shell's hover request.
	 */
	#[DataProvider( 'provide_page_loads' )]
	public function test_only_the_admin_shell_hover_skips_creating_the_purchase_token( $is_guest, $is_hover ) {
		if ( $is_hover ) {
			add_filter( 'wp_doing_ajax', '__return_true' );
			$_GET['action'] = Admin_Shell::GUEST_ACTION;
		}
		wp_set_current_user( $this->admin_id );
		set_current_screen( 'jetpack_page_jetpack-search' );
		// A site connection with no connected user, the only state that gets a purchase token.
		add_filter( 'jetpack_options', array( $this, 'mock_site_connection_without_users' ), 11, 2 );
		( new Connection_Manager() )->reset_connection_status();
		$dashboard = new class() extends Dashboard {
			/**
			 * @return string
			 */
			protected function wp_build_index() {
				return __DIR__ . '/fixtures/wp-build-index.php';
			}
		};

		if ( $is_guest ) {
			$dashboard->load_as_admin_shell_guest();
		} else {
			$dashboard->admin_init();
		}
		do_action( 'admin_enqueue_scripts', 'jetpack_page_jetpack-search' );

		$this->assertStringContainsString( 'JETPACK_SEARCH_DASHBOARD_INITIAL_STATE', implode( "\n", (array) wp_scripts()->get_data( Dashboard::DATA_SCRIPT_HANDLE, 'before' ) ) );
		$this->assertSame( ! $is_hover, (bool) Jetpack_Options::get_option( 'purchase_token' ) );
	}

	/**
	 * Drop the user tokens the base test case's connection mock adds.
	 *
	 * @param mixed  $value The current option value.
	 * @param string $name  Option name.
	 * @return mixed
	 */
	public function mock_site_connection_without_users( $value, $name ) {
		return 'user_tokens' === $name ? array() : $value;
	}

	/**
	 * The page's own load, the shell's hover request, and another dashboard's page readying Search for a later switch.
	 *
	 * @return array<string, array{bool, bool}>
	 */
	public static function provide_page_loads() {
		return array(
			'page load'           => array( false, false ),
			'hover request'       => array( true, true ),
			'another member page' => array( true, false ),
		);
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
