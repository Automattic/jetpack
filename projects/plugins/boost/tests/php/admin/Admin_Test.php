<?php

namespace Automattic\Jetpack_Boost\Tests\Admin;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Menu_Badges\Notification_Counts;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use Automattic\Jetpack_Boost\Admin\Admin;
use Automattic\Jetpack_Boost\Admin\Config;
use Automattic\Jetpack_Boost\Lib\Debug;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Functions;

if ( ! defined( 'JETPACK_BOOST_SLUG' ) ) {
	define( 'JETPACK_BOOST_SLUG', 'jetpack-boost' );
}

/**
 * Verifies that Admin::handle_admin_menu() reports the Boost problem count to
 * the central menu-badges registry, rather than hand-writing a menu-counter
 * span into the submenu label.
 */
class Admin_Test extends Base_TestCase {
	private $original_get;
	private $original_menu_items;

	protected function set_up() {
		parent::set_up();
		$this->original_get        = $_GET;
		$this->original_menu_items = $this->menu_items_property()->getValue();
		unset( $_GET['page'] );
		if ( ! defined( 'JETPACK_BOOST_PATH' ) ) {
			define( 'JETPACK_BOOST_PATH', dirname( __DIR__, 3 ) . '/jetpack-boost.php' );
		}

		Functions\when( '__' )->returnArg();

		// Boost only reports its count to users who can reach the menu; default the
		// capability to true so the registration path runs. Overridden per-test below.
		Functions\when( 'current_user_can' )->justReturn( true );

		// Start each test with a clean registry; other suites registering
		// under different ids don't matter here since we only assert on
		// the 'jetpack-boost' menu slug.
		Notification_Counts::reset();
	}

	protected function tear_down() {
		$_GET = $this->original_get;
		$this->menu_items_property()->setValue( null, $this->original_menu_items );
		Notification_Counts::reset();
		parent::tear_down();
	}

	public function test_registers_zero_count_when_no_problems() {
		( new Admin() )->handle_admin_menu();

		$this->assertSame( 0, Notification_Counts::get_for_menu( JETPACK_BOOST_SLUG ) );
	}

	public function test_registers_filtered_problem_count() {
		// Only override the Boost problem-count filter; pass every other
		// apply_filters() call through unchanged (e.g. the registry's own
		// 'jetpack_menu_notification_counts' filter, invoked below via
		// Notification_Counts::get_for_menu()).
		Functions\when( 'apply_filters' )->alias(
			function ( $hook_name, $value = null ) {
				if ( 'jetpack_boost_total_problem_count' === $hook_name ) {
					return 3;
				}
				return $value;
			}
		);

		( new Admin() )->handle_admin_menu();

		$this->assertSame( 3, Notification_Counts::get_for_menu( JETPACK_BOOST_SLUG ) );
	}

	public function test_skips_registration_for_users_without_manage_options() {
		// A user who can't reach the Boost menu (added with 'manage_options') must not
		// contribute to the central menu-badges total.
		Functions\when( 'current_user_can' )->justReturn( false );

		( new Admin() )->handle_admin_menu();

		$this->assertSame( array(), Notification_Counts::all() );
	}

	public function test_modern_dashboard_defaults_off() {
		$_GET['page'] = JETPACK_BOOST_SLUG;
		Functions\expect( 'is_admin' )->never();
		$admin = new Admin();

		$admin->handle_admin_menu();

		$this->assertSame( array( $admin, 'render_settings' ), $this->last_menu_callback() );
		$this->assertFalse( has_action( 'current_screen', array( $admin, 'alias_screen_id_for_wp_build' ) ) );
	}

	public function test_modern_dashboard_can_be_filtered_off() {
		Functions\when( 'apply_filters' )->alias(
			function ( $hook, $value = null ) {
				return 'rsm_jetpack_ui_modernization_boost' === $hook ? false : $value;
			}
		);
		$_GET['page'] = JETPACK_BOOST_SLUG;
		Functions\expect( 'is_admin' )->never();
		$admin = new Admin();

		$admin->handle_admin_menu();

		$this->assertSame( array( $admin, 'render_settings' ), $this->last_menu_callback() );
		$this->assertFalse( has_action( 'current_screen', array( $admin, 'alias_screen_id_for_wp_build' ) ) );
	}

	public function test_modern_dashboard_does_not_load_off_page() {
		$this->enable_modern_dashboard();
		$_GET['page'] = 'another-plugin';
		Functions\expect( 'Automattic\\Jetpack_Boost\\Admin\\file_exists' )->never();
		$admin = new Admin();

		$admin->handle_admin_menu();

		$this->assertSame( array( $admin, 'render_settings' ), $this->last_menu_callback() );
		$this->assertFalse( has_action( 'current_screen', array( $admin, 'alias_screen_id_for_wp_build' ) ) );
	}

	public function test_missing_modern_build_logs_and_keeps_legacy_page() {
		$this->enable_modern_dashboard();
		Functions\expect( 'Automattic\\Jetpack_Boost\\Admin\\file_exists' )
			->once()->with( JETPACK_BOOST_DIR_PATH . '/build/build.php' )->andReturn( false );
		$messages = array();
		\Patchwork\redefine(
			Debug::class . '::log',
			function ( $message ) use ( &$messages ) {
				$messages[] = $message;
			}
		);
		$admin = new Admin();

		$admin->handle_admin_menu();

		$this->assertSame( array( $admin, 'render_settings' ), $this->last_menu_callback() );
		$this->assertSame( array( 'Modern dashboard build is missing; loading the legacy dashboard.' ), $messages );
		$this->assertFalse( has_action( 'current_screen', array( $admin, 'alias_screen_id_for_wp_build' ) ) );
	}

	public function test_modern_dashboard_does_not_load_without_a_page() {
		$this->enable_modern_dashboard();
		unset( $_GET['page'] );
		Functions\expect( 'Automattic\\Jetpack_Boost\\Admin\\file_exists' )->never();
		$admin = new Admin();

		$admin->handle_admin_menu();

		$this->assertSame( array( $admin, 'render_settings' ), $this->last_menu_callback() );
		$this->assertFalse( has_action( 'current_screen', array( $admin, 'alias_screen_id_for_wp_build' ) ) );
	}

	public function test_modern_dashboard_does_not_load_on_front_end() {
		$this->enable_modern_dashboard();
		Functions\when( 'is_admin' )->justReturn( false );
		Functions\expect( 'Automattic\\Jetpack_Boost\\Admin\\file_exists' )->never();
		$admin = new Admin();

		$admin->handle_admin_menu();

		$this->assertSame( array( $admin, 'render_settings' ), $this->last_menu_callback() );
		$this->assertFalse( has_action( 'current_screen', array( $admin, 'alias_screen_id_for_wp_build' ) ) );
	}

	public function test_modern_build_registers_polyfills_and_modules_before_aliasing_screen() {
		$this->enable_modern_dashboard();
		$events = array();
		\Patchwork\redefine(
			Admin::class . '::load_wp_build',
			function () use ( &$events ) {
				$events[] = 'build';
				return true;
			}
		);
		\Patchwork\redefine(
			WP_Build_Polyfills::class . '::register',
			function ( $consumer, $polyfills ) use ( &$events ) {
				$events[] = 'polyfills';
				$this->assertSame( 'jetpack-boost', $consumer );
				$this->assertSame( array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS ), $polyfills );
			}
		);
		$admin = new Admin();
		Functions\expect( 'jetpack_boost_register_script_modules' )->once()->andReturnUsing(
			function () use ( &$events, $admin ) {
				$events[] = 'modules';
				$this->assertFalse( has_action( 'current_screen', array( $admin, 'alias_screen_id_for_wp_build' ) ) );
			}
		);

		$admin->handle_admin_menu();

		$this->assertSame( array( 'build', 'polyfills', 'modules' ), $events );
		$this->assertSame( 'jetpack_boost_jetpack_boost_dashboard_wp_admin_render_page', $this->last_menu_callback() );
		$screen = \Mockery::mock( \WP_Screen::class );
		'@phan-var \WP_Screen $screen';
		$screen->id = 'jetpack_page_jetpack-boost';
		$this->assertNotFalse( has_action( 'current_screen', array( $admin, 'alias_screen_id_for_wp_build' ) ) );
		$admin->alias_screen_id_for_wp_build( $screen );
		$this->assertSame( 'jetpack-boost-dashboard', $screen->id );
	}

	public function test_legacy_enqueue_keeps_existing_assets_and_localization() {
		$constants = array( 'site' => array( 'online' => true ) );
		Functions\expect( 'wp_scripts' )->never();
		Functions\expect( 'wp_enqueue_script' )->never();
		Functions\expect( 'wp_localize_script' )->once()
			->with( 'jetpack-boost-admin', 'Jetpack_Boost', $constants );
		\Patchwork\redefine(
			Config::class . '::constants',
			function () use ( $constants ) {
				return $constants;
			}
		);
		$registered = array();
		$enqueued   = array();
		\Patchwork\redefine(
			Assets::class . '::register_script',
			function ( ...$args ) use ( &$registered ) {
				$registered = $args;
			}
		);
		\Patchwork\redefine(
			Assets::class . '::enqueue_script',
			function ( $handle ) use ( &$enqueued ) {
				$enqueued[] = $handle;
			}
		);

		( new Admin() )->enqueue_scripts();

		$this->assertSame(
			array(
				'jetpack-boost-admin',
				'app/assets/dist/jetpack-boost.js',
				JETPACK_BOOST_PATH,
				array(
					'dependencies' => array( 'wp-i18n', 'wp-components', 'my_jetpack_main_app' ),
					'in_footer'    => true,
					'textdomain'   => 'jetpack-boost',
					'css_path'     => 'app/assets/dist/jetpack-boost.css',
				),
			),
			$registered
		);
		$this->assertSame( array( 'jetpack-boost-admin' ), $enqueued );
	}

	public function test_modern_prerequisites_wait_for_webpack_bootstrap_and_i18n() {
		$this->assert_modern_prerequisites( true );
	}

	public function test_modern_prerequisites_work_without_registered_i18n_loader() {
		$this->assert_modern_prerequisites( false );
	}

	private function assert_modern_prerequisites( $has_i18n_loader ) {
		$admin  = new Admin();
		$loaded = new \ReflectionProperty( Admin::class, 'modern_dashboard_loaded' );
		$loaded->setAccessible( true );
		$loaded->setValue( $admin, true );
		$constants     = array(
			'site' => array(
				'url'    => 'https://example.org',
				'online' => true,
			),
		);
		$events        = array();
		$localized     = array();
		$prerequisites = (object) array( 'deps' => array( 'wp-i18n' ) );
		$scripts       = \Mockery::mock();
		$scripts->shouldReceive( 'query' )->once()
			->with( 'jetpack-boost-dashboard-wp-admin-prerequisites', 'registered' )->andReturnUsing(
				function () use ( &$events, $prerequisites ) {
					$events[] = 'prerequisites';
					return $prerequisites;
				}
			);
		Functions\when( 'wp_scripts' )->justReturn( $scripts );
		Functions\when( 'rest_url' )->justReturn( 'https://example.org/wp-json/' );
		Functions\when( 'wp_create_nonce' )->returnArg();
		Functions\expect( 'wp_script_is' )->once()->with( 'wp-jp-i18n-loader', 'registered' )->andReturn( $has_i18n_loader );
		Functions\expect( 'wp_enqueue_script' )->times( $has_i18n_loader ? 1 : 0 )->with( 'wp-jp-i18n-loader' )->andReturnUsing(
			function () use ( &$events ) {
				$events[] = 'i18n';
			}
		);
		Functions\when( 'wp_localize_script' )->alias(
			function ( $handle, $name, $data ) use ( &$localized, &$events ) {
				$events[]                      = $name;
				$localized[ $handle ][ $name ] = $data;
			}
		);
		\Patchwork\redefine(
			Config::class . '::constants',
			function () use ( $constants ) {
				return $constants;
			}
		);
		\Patchwork\redefine(
			Assets::class . '::register_script',
			function () use ( &$events ) {
				$events[] = 'register';
			}
		);
		\Patchwork\redefine(
			Assets::class . '::enqueue_script',
			function () use ( &$events ) {
				$events[] = 'enqueue';
			}
		);

		$admin->enqueue_scripts();
		'@phan-var array<string, array<string, mixed>> $localized';

		$expected_events = array( 'register', 'Jetpack_Boost', 'enqueue', 'wpApiSettings' );
		$expected_deps   = array( 'wp-i18n', 'jetpack-boost-admin' );
		if ( $has_i18n_loader ) {
			$expected_events[] = 'i18n';
			$expected_deps[]   = 'wp-jp-i18n-loader';
		}
		$expected_events[] = 'prerequisites';
		$this->assertSame( $expected_events, $events );
		$this->assertSame( $expected_deps, $prerequisites->deps );
		$this->assertSame( $constants, $localized['jetpack-boost-admin']['Jetpack_Boost'] );
		$this->assertSame(
			array(
				'root'  => 'https://example.org/wp-json/',
				'nonce' => 'wp_rest',
			),
			$localized['jetpack-boost-admin']['wpApiSettings']
		);
	}

	public function test_datasync_localizes_real_boost_entries_through_registered_page_callback() {
		require_once JETPACK_BOOST_DIR_PATH . '/wp-js-data-sync.php';
		Functions\when( 'get_option' )->justReturn( array() );
		Functions\when( 'rest_url' )->returnArg();
		Functions\when( 'wp_create_nonce' )->returnArg();
		foreach ( array(
			'Automattic\\Jetpack_Boost\\Lib\\Connection::get_connection_api_response',
			'Automattic\\Jetpack_Boost\\Lib\\Premium_Pricing::get_yearly_pricing',
			'Automattic\\Jetpack_Boost\\Lib\\My_Jetpack::get_product',
			'Automattic\\Jetpack_Boost\\Lib\\Premium_Features::get_features',
		) as $method ) {
			\Patchwork\redefine(
				$method,
				function () {
					return array();
				}
			);
		}
		\Patchwork\redefine(
			'Automattic\\Jetpack_Boost\\Data_Sync\\Getting_Started_Entry::get',
			function () {
				return false;
			}
		);
		$data          = null;
		$page_callback = null;
		\Brain\Monkey\Actions\expectAdded( 'jetpack_page_jetpack-boost' )->once()->with(
			\Mockery::on(
				function ( $callback ) use ( &$page_callback ) {
					$page_callback = $callback;
					return is_callable( $callback );
				}
			)
		);
		Functions\expect( 'wp_localize_script' )->once()
			->with( 'jetpack-boost-admin', JETPACK_BOOST_DATASYNC_NAMESPACE, \Mockery::type( 'array' ) )
			->andReturnUsing(
				function ( $handle, $namespace, $value ) use ( &$data ) {
					$data = $value;
				}
			);

		$this->assertNotFalse( has_action( 'admin_init', 'jetpack_boost_initialize_datasync' ) );
		jetpack_boost_initialize_datasync();
		$this->assertNull( $data );
		$this->assertIsCallable( $page_callback );
		$page_callback();
		$this->assertNotNull( $data );
		$this->assertFalse( $data['getting_started']['value'] );
		$this->assertFalse( $data['dismissed_alerts']['value']['score_increase'] );
		$this->assertNotEmpty( $data['dismissed_alerts']['nonce'] );
	}

	private function enable_modern_dashboard() {
		Functions\when( 'apply_filters' )->alias(
			function ( $hook, $value = null ) {
				return 'rsm_jetpack_ui_modernization_boost' === $hook ? true : $value;
			}
		);
		Functions\when( 'is_admin' )->justReturn( true );
		Functions\when( 'sanitize_text_field' )->returnArg();
		$_GET['page'] = JETPACK_BOOST_SLUG;
	}

	private function menu_items_property() {
		$property = new \ReflectionProperty( Admin_Menu::class, 'menu_items' );
		$property->setAccessible( true );
		return $property;
	}

	private function last_menu_callback() {
		$items = $this->menu_items_property()->getValue();
		return end( $items )['function'];
	}
}
