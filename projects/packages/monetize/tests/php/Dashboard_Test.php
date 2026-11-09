<?php
/**
 * Tests for the Monetize dashboard.
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Monetize\Dashboard
 */
#[CoversClass( Dashboard::class )]
class Dashboard_Test extends BaseTestCase {

	/**
	 * Start from an empty menu queue.
	 */
	public function set_up() {
		parent::set_up();
		Admin_Menu::reset();
	}

	/**
	 * Leave no queued items or hooks behind.
	 */
	public function tear_down() {
		Admin_Menu::reset();
		unset( $_GET['page'] );
		remove_all_actions( 'admin_menu' );
		remove_all_actions( 'admin_enqueue_scripts' );
		unset( $GLOBALS['submenu']['jetpack'] );
		wp_set_current_user( 0 );
		Constants::clear_constants();
		Cache::clear();
		remove_all_actions( 'rest_api_init' );
		remove_all_actions( 'doing_it_wrong_run' );
		remove_all_filters( 'doing_it_wrong_trigger_error' );
		self::reset_sections();
		parent::tear_down();
	}

	/**
	 * Empty the private section registry.
	 */
	private static function reset_sections() {
		$sections = new \ReflectionProperty( Dashboard::class, 'sections' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$sections->setAccessible( true );
		}
		$sections->setValue( null, array() );
	}

	/**
	 * The constants that identify each host, and whether init() should queue the sidebar item and the REST routes.
	 *
	 * @return array[]
	 */
	public static function provide_hosts() {
		return array(
			'self-hosted' => array( array(), true, true ),
			'Simple'      => array( array( 'IS_WPCOM' => true ), false, false ),
			'Atomic'      => array(
				array(
					'ATOMIC_SITE_ID'       => 1,
					'ATOMIC_CLIENT_ID'     => 2,
					'WPCOMSH__PLUGIN_FILE' => 'wpcomsh.php',
				),
				false,
				true,
			),
		);
	}

	/**
	 * @dataProvider provide_hosts
	 *
	 * @param array $constants Host constants to set.
	 * @param bool  $queued    Whether the sidebar item should be queued.
	 * @param bool  $routes    Whether the REST routes should be registered.
	 */
	#[DataProvider( 'provide_hosts' )]
	public function test_init_queues_the_item_off_the_wpcom_platform_and_routes_off_simple( $constants, $queued, $routes ) {
		foreach ( $constants as $name => $value ) {
			Constants::set_constant( $name, $value );
		}

		Dashboard::init( array( 'module' => 'monetize' ) );
		$priority = has_action( 'admin_menu', array( Dashboard::class, 'add_menu' ) );
		$this->assertSame( $routes, false !== has_action( 'rest_api_init', array( Dashboard::class, 'register_rest_routes' ) ) );

		if ( ! $queued ) {
			$this->assertFalse( $priority );
			return;
		}
		$this->assertIsInt( $priority );
		$this->assertLessThan( 1000, $priority, 'Admin_Menu registers its queued items at 1000.' );

		Dashboard::add_menu();

		$item = Admin_Menu::remove_menu( Dashboard::MENU_SLUG );
		$this->assertSame( array( Dashboard::class, 'render' ), $item['function'] );
		$this->assertSame( 'monetize', $item['args']['module'] );
	}

	public function test_add_wp_admin_submenu_adds_the_page_under_the_jetpack_menu() {
		global $submenu;
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		$user_id = wp_insert_user(
			array(
				'user_login' => 'monetize-admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		Dashboard::add_wp_admin_submenu();

		$item = array_values( array_filter( $submenu['jetpack'] ?? array(), fn( $entry ) => Dashboard::MENU_SLUG === $entry[2] ) );
		$this->assertCount( 1, $item );
		$this->assertSame( 'manage_options', $item[0][1] );
		$this->assertNotFalse( has_action( get_plugin_page_hookname( Dashboard::MENU_SLUG, 'jetpack' ), array( Dashboard::class, 'render' ) ) );
	}

	public function test_render_says_so_when_the_build_is_missing() {
		ob_start();
		Dashboard::render();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'could not be loaded because its assets are missing', $output );
	}

	/**
	 * Build indexes that can't render the page.
	 *
	 * @return array[]
	 */
	public static function provide_unusable_builds() {
		return array(
			'no build'    => array( __DIR__ . '/fixtures/missing-build.php' ),
			'stale build' => array( __DIR__ . '/fixtures/stale-build.php' ),
		);
	}

	/**
	 * @dataProvider provide_unusable_builds
	 *
	 * @param string $build_index Path to the build index.
	 */
	#[DataProvider( 'provide_unusable_builds' )]
	public function test_load_wp_build_leaves_core_scripts_alone_without_a_usable_build( $build_index ) {
		$this->assertFalse( Dashboard::load_wp_build( $build_index ) );
		$this->assertFalse( has_action( 'admin_enqueue_scripts', array( Dashboard::class, 'enqueue_i18n_loader' ) ) );
		$this->assertNotContains( 'jetpack-monetize', array_merge( array(), ...array_values( WP_Build_Polyfills::get_consumers() ) ) );
	}

	/**
	 * Runs alone because the fixture defines the render function for the rest of the process.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_load_wp_build_wires_a_usable_build_inside_the_screen_alias() {
		require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'jetpack_page_jetpack-monetize' );

		$this->assertTrue( Dashboard::load_wp_build( __DIR__ . '/fixtures/usable-build.php' ) );
		$this->assertNotFalse( has_action( 'admin_enqueue_scripts', array( Dashboard::class, 'enqueue_i18n_loader' ) ) );
		$this->assertContains( 'jetpack-monetize', array_merge( array(), ...array_values( WP_Build_Polyfills::get_consumers() ) ) );

		do_action( 'admin_enqueue_scripts' );

		$this->assertSame( Dashboard::WP_BUILD_PAGE_ID, $GLOBALS['jetpack_monetize_test_enqueue_screen_id'] );
		$this->assertSame( 'jetpack_page_jetpack-monetize', get_current_screen()->id );
	}

	/**
	 * Requested `page` values and whether each is the dashboard's.
	 *
	 * @return array[]
	 */
	public static function provide_page_requests() {
		return array(
			'the Monetize page' => array( Dashboard::MENU_SLUG, true ),
			'another page'      => array( 'jetpack', false ),
			'no page'           => array( null, false ),
		);
	}

	/**
	 * @dataProvider provide_page_requests
	 *
	 * @param string|null $page     The requested `page`, or null for none.
	 * @param bool        $expected Whether the request is for the dashboard.
	 */
	#[DataProvider( 'provide_page_requests' )]
	public function test_is_dashboard_request_matches_only_the_monetize_page( $page, $expected ) {
		if ( null !== $page ) {
			$_GET['page'] = $page;
		}

		$this->assertSame( $expected, Dashboard::is_dashboard_request() );
	}

	public function test_init_registers_each_section_once() {
		$doing_it_wrong = new \ArrayObject();
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		add_action(
			'doing_it_wrong_run',
			function ( $function_name ) use ( $doing_it_wrong ) {
				$doing_it_wrong[] = $function_name;
			}
		);

		Dashboard::init();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Running twice is the behavior under test.
		Dashboard::init();

		$this->assertSame( array( 'payments' ), array_keys( Dashboard::get_initial_state() ) );
		$this->assertCount( 0, $doing_it_wrong );
	}

	public function test_print_initial_state_prints_escaped_objects() {
		Dashboard::register_section( $this->section( 'example', array( 'title' => '</script>' ) ) );
		Dashboard::register_section( $this->section( 'empty', array() ) );

		ob_start();
		Dashboard::print_initial_state();
		$output = ob_get_clean();

		$this->assertStringContainsString( 'window.jetpackMonetizeDashboard = {"example":{"title":"\\u003C/script\\u003E"},"empty":{}};', $output );
	}

	/**
	 * A section with a fixed key and state, and no routes.
	 *
	 * @param string $key   Section key.
	 * @param array  $state Section state.
	 * @return Dashboard_Section
	 */
	private function section( $key, array $state ) {
		return new class( $key, $state ) implements Dashboard_Section {
			/**
			 * Section key.
			 *
			 * @var string
			 */
			private $key;

			/**
			 * Section state.
			 *
			 * @var array
			 */
			private $state;

			/**
			 * @param string $key   Section key.
			 * @param array  $state Section state.
			 */
			public function __construct( $key, array $state ) {
				$this->key   = $key;
				$this->state = $state;
			}

			/** @return string */
			public function get_key() {
				return $this->key;
			}

			/** @return array */
			public function get_state() {
				return $this->state;
			}

			/** @return void */
			public function register_routes() {}
		};
	}
}
