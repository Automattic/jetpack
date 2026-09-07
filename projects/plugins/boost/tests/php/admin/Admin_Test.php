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
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

if ( ! defined( 'JETPACK_BOOST_SLUG' ) ) {
	define( 'JETPACK_BOOST_SLUG', 'jetpack-boost' );
}

/**
 * Verifies that Admin::handle_admin_menu() reports the Boost problem count to the
 * central menu-badges registry rather than hand-writing a menu-counter span into
 * the submenu label, and that the modern dashboard loads only behind its filter.
 */
class Admin_Test extends Base_TestCase {
	private $original_get;
	private $original_menu_items;
	private $localized      = array();
	private $enqueued       = array();
	private $script_checks  = array();
	private $enqueue_events = array();

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

	public function test_modern_build_registers_polyfills_and_modules_before_aliasing_screen() {
		$this->enable_modern_dashboard();
		$events = array();
		\Patchwork\redefine(
			Admin::class . '::dashboard_build_is_available',
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

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_existing_build_without_generated_functions_keeps_legacy_page() {
		$fixture = JETPACK_BOOST_DIR_PATH . '/.cache/admin-build-' . uniqid();
		mkdir( $fixture . '/build', 0777, true );
		$build_file = $fixture . '/build/build.php';
		file_put_contents( $build_file, '<?php // No generated dashboard functions.' );
		define( 'Automattic\\Jetpack_Boost\\Admin\\JETPACK_BOOST_DIR_PATH', $fixture );

		try {
			$this->enable_modern_dashboard();
			$admin = new Admin();

			$admin->handle_admin_menu();

			$this->assertContains( realpath( $build_file ), get_included_files() );
			$this->assertSame( array( $admin, 'render_settings' ), $this->last_menu_callback() );
			$this->assertFalse( has_action( 'current_screen', array( $admin, 'alias_screen_id_for_wp_build' ) ) );
		} finally {
			unlink( $build_file );
			rmdir( $fixture . '/build' );
			rmdir( $fixture );
		}
	}

	public function test_enqueue_localizes_boost_constants() {
		$admin     = $this->prepare_enqueue_scripts();
		$constants = array( 'site' => array( 'url' => 'https://example.org' ) );
		\Patchwork\redefine(
			Config::class . '::constants',
			function () use ( $constants ) {
				return $constants;
			}
		);
		$admin->enqueue_scripts();

		$this->assertSame( $constants, $this->localized['jetpack-boost-admin']['Jetpack_Boost'] );
	}

	/**
	 * @dataProvider dashboard_modes
	 */
	#[DataProvider( 'dashboard_modes' )]
	public function test_legacy_and_modern_dashboard_localize_api_settings( $modern ) {
		$admin = $this->prepare_enqueue_scripts( $modern );

		if ( $modern ) {
			$admin->enqueue_scripts();
		} else {
			ob_start();
			try {
				$admin->render_settings();
			} finally {
				ob_end_clean();
			}
		}
		$this->assertSame(
			array(
				'root'  => 'https://example.org/wp-json/',
				'nonce' => 'wp_rest',
			),
			$this->localized['jetpack-boost-admin']['wpApiSettings']
		);
	}

	public static function dashboard_modes() {
		return array(
			'legacy' => array( false ),
			'modern' => array( true ),
		);
	}

	public function test_modern_dashboard_enqueues_registered_i18n_loader() {
		$admin = $this->prepare_enqueue_scripts( true );
		$admin->enqueue_scripts();

		$this->assertSame( array( array( 'wp-jp-i18n-loader', 'registered' ) ), $this->script_checks );
		$this->assertSame( array( 'wp-jp-i18n-loader' ), $this->enqueued );
	}

	public function test_modern_dashboard_skips_unregistered_i18n_loader() {
		$admin         = $this->prepare_enqueue_scripts( true );
		$prerequisites = $this->mock_prerequisites();
		Functions\when( 'wp_script_is' )->justReturn( false );

		$admin->enqueue_scripts();

		$this->assertSame( array(), $this->enqueued );
		$this->assertSame( array( 'wp-i18n', 'jetpack-boost-admin' ), $prerequisites->deps );
		$this->assertSame( array( 'register', 'Jetpack_Boost', 'enqueue', 'wpApiSettings', 'prerequisites' ), $this->enqueue_events );
	}

	public function test_modern_prerequisites_wait_for_webpack_bootstrap_and_i18n() {
		$admin         = $this->prepare_enqueue_scripts( true );
		$prerequisites = $this->mock_prerequisites();

		$admin->enqueue_scripts();

		$this->assertSame( array( 'wp-i18n', 'jetpack-boost-admin', 'wp-jp-i18n-loader' ), $prerequisites->deps );
		$this->assertSame( array( 'register', 'Jetpack_Boost', 'enqueue', 'wpApiSettings', 'i18n', 'prerequisites' ), $this->enqueue_events );
	}

	public function test_missing_modern_prerequisites_are_logged() {
		$admin   = $this->prepare_enqueue_scripts( true );
		$scripts = \Mockery::mock();
		$scripts->shouldReceive( 'query' )->once()
			->with( 'jetpack-boost-dashboard-wp-admin-prerequisites', 'registered' )->andReturn( false );
		Functions\when( 'wp_scripts' )->justReturn( $scripts );
		$messages = array();
		\Patchwork\redefine(
			Debug::class . '::log',
			function ( $message ) use ( &$messages ) {
				$messages[] = $message;
			}
		);

		$admin->enqueue_scripts();

		$this->assertSame(
			array( 'Modern dashboard prerequisites are not registered; bootstrap dependencies could not be attached.' ),
			$messages
		);
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

	private function prepare_enqueue_scripts( $modern = false ) {
		$admin  = new Admin();
		$loaded = new \ReflectionProperty( Admin::class, 'modern_dashboard_loaded' );
		if ( PHP_VERSION_ID < 80100 ) {
			$loaded->setAccessible( true );
		}
		$loaded->setValue( $admin, $modern );
		if ( ! defined( 'JETPACK_BOOST_PATH' ) ) {
			define( 'JETPACK_BOOST_PATH', dirname( __DIR__, 3 ) . '/jetpack-boost.php' );
		}
		Functions\when( 'rest_url' )->justReturn( 'https://example.org/wp-json/' );
		Functions\when( 'wp_create_nonce' )->returnArg();
		Functions\when( 'wp_localize_script' )->alias(
			function ( $handle, $name, $data ) {
				$this->enqueue_events[]              = $name;
				$this->localized[ $handle ][ $name ] = $data;
			}
		);
		Functions\when( 'wp_script_is' )->alias(
			function ( $handle, $status ) {
				$this->script_checks[] = array( $handle, $status );
				return true;
			}
		);
		Functions\when( 'wp_enqueue_script' )->alias(
			function ( $handle ) {
				$this->enqueue_events[] = 'i18n';
				$this->enqueued[]       = $handle;
			}
		);
		\Patchwork\redefine(
			Config::class . '::constants',
			function () {
				return array();
			}
		);
		\Patchwork\redefine(
			Assets::class . '::register_script',
			function () {
				$this->enqueue_events[] = 'register';
			}
		);
		\Patchwork\redefine(
			Assets::class . '::enqueue_script',
			function () {
				$this->enqueue_events[] = 'enqueue';
			}
		);
		$this->mock_prerequisites();
		return $admin;
	}

	private function mock_prerequisites() {
		$prerequisites = (object) array( 'deps' => array( 'wp-i18n' ) );
		$scripts       = \Mockery::mock();
		$scripts->shouldReceive( 'query' )
			->with( 'jetpack-boost-dashboard-wp-admin-prerequisites', 'registered' )->andReturnUsing(
				function () use ( $prerequisites ) {
					$this->enqueue_events[] = 'prerequisites';
					return $prerequisites;
				}
			);
		Functions\when( 'wp_scripts' )->justReturn( $scripts );
		return $prerequisites;
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
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		return $property;
	}

	private function last_menu_callback() {
		$items = $this->menu_items_property()->getValue();
		return end( $items )['function'];
	}
}
