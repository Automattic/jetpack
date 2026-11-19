<?php
/**
 * Menu visibility resolver tests.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\My_Jetpack\Products\Backup;
use Automattic\Jetpack\My_Jetpack\Products\Videopress;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

require_once __DIR__ . '/class-sample-gated-product.php';

/**
 * Unit tests for the Menu_Visibility class.
 */
class Menu_Visibility_Test extends TestCase {

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		add_filter( 'my_jetpack_products_classes', array( $this, 'replace_stats_product' ) );
	}

	/**
	 * Returning the environment to its previous state.
	 */
	public function tearDown(): void {
		remove_filter( 'my_jetpack_products_classes', array( $this, 'replace_stats_product' ) );
		remove_filter( 'jetpack_get_module_path', array( $this, 'ship_stats_module' ), 10 );
		remove_filter( 'jetpack_get_available_modules', array( $this, 'remove_stats_module' ), 20 );
		remove_filter( 'jetpack_active_modules', array( $this, 'activate_sample_module' ) );
		remove_filter( 'map_meta_cap', array( $this, 'map_module_caps' ) );
		remove_filter( 'jetpack_get_available_standalone_modules', array( $this, 'offer_sample_module' ) );
		remove_filter( 'jetpack_get_available_modules', array( $this, 'offer_sample_module_with_version' ) );
		Sample_Gated_Product::$active              = true;
		Sample_Gated_Product::$activation_attempts = 0;
		Sample_Gated_Product::$held_off            = false;
		Sample_Gated_Product::$installed           = true;
		Admin_Menu::set_visibility_resolver( null );
		$this->reset_admin_menu();
		$this->reset_resolved_gates();
		$this->uninstall_backup_mock_plugin();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		parent::tearDown();
	}

	/**
	 * Drops the items and init flag Admin_Menu keeps statically, so they don't leak into later tests.
	 *
	 * @return void
	 */
	private function reset_admin_menu() {
		$reflection = new \ReflectionClass( Admin_Menu::class );

		foreach ( array(
			'menu_items'  => array(),
			'initialized' => false,
		) as $property => $value ) {
			$property = $reflection->getProperty( $property );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$property->setAccessible( true );
			}
			$property->setValue( null, $value );
		}
	}

	/**
	 * Removes the stand-in Backup plugin one test installs, so it cannot outlive that test.
	 *
	 * @return void
	 */
	private function uninstall_backup_mock_plugin() {
		$plugin_file = WP_PLUGIN_DIR . '/' . Backup::$plugin_slug . '/jetpack-backup.php';

		if ( file_exists( $plugin_file ) ) {
			deactivate_plugins( Backup::$plugin_slug . '/jetpack-backup.php' );
			unlink( $plugin_file );
			wp_cache_delete( 'plugins', 'plugins' );
		}
	}

	/**
	 * Drops the gates Menu_Visibility memoized, which outlive a request only in tests.
	 *
	 * @return void
	 */
	private function reset_resolved_gates() {
		$property = new \ReflectionProperty( Menu_Visibility::class, 'resolved' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, array() );
	}

	/**
	 * Swaps the Stats product for one whose activation the test controls.
	 *
	 * @param array $classes The registered product classes.
	 * @return array
	 */
	public function replace_stats_product( $classes ) {
		$classes['stats'] = Sample_Gated_Product::class;

		return $classes;
	}

	/**
	 * A declaration naming an active product resolves true.
	 */
	public function test_active_product_resolves_true() {
		Sample_Gated_Product::$active = true;

		$this->assertTrue( Menu_Visibility::resolve( array( 'product' => 'stats' ) ) );
	}

	/**
	 * A declaration naming an inactive product resolves false.
	 */
	public function test_inactive_product_resolves_false() {
		Sample_Gated_Product::$active = false;

		$this->assertFalse( Menu_Visibility::resolve( array( 'product' => 'stats' ) ) );
	}

	/**
	 * A product slug with no class behind it cannot be answered.
	 */
	public function test_unknown_product_resolves_null() {
		$this->assertNull( Menu_Visibility::resolve( array( 'product' => 'not-a-product' ) ) );
	}

	/**
	 * A declaration with no gate cannot be answered.
	 */
	public function test_empty_declaration_resolves_null() {
		$this->assertNull( Menu_Visibility::resolve( array() ) );
	}

	/**
	 * A module declaration follows the module's active state.
	 *
	 * Driven through `jetpack_active_modules` rather than the option, because what makes a
	 * module available differs by whether the Jetpack plugin is loaded, and this is asserting
	 * that resolve() delegates — not how the Modules package computes availability.
	 */
	public function test_module_declaration_follows_the_module() {
		$this->offer_sample_module_either_way();
		add_filter( 'jetpack_active_modules', array( $this, 'activate_sample_module' ) );

		$this->assertTrue( Menu_Visibility::resolve( array( 'module' => 'sample-module' ) ) );
	}

	/**
	 * A module this site has, but has switched off, removes the item.
	 */
	public function test_available_but_inactive_module_resolves_false() {
		$this->offer_sample_module_either_way();

		$this->assertFalse( Menu_Visibility::resolve( array( 'module' => 'sample-module' ) ) );
	}

	/**
	 * A name this site has no module for is unanswerable, so the item stays.
	 */
	public function test_unknown_module_resolves_null() {
		$this->assertNull( Menu_Visibility::resolve( array( 'module' => 'not-a-module' ) ) );
	}

	/**
	 * Reports one module as active.
	 *
	 * @param array $modules Active module slugs.
	 * @return array
	 */
	public function activate_sample_module( $modules ) {
		$modules[] = 'sample-module';

		return $modules;
	}

	/**
	 * Maps the module capability to manage_options.
	 *
	 * @param string[] $caps Primitive capabilities.
	 * @param string   $cap  Capability checked.
	 * @return string[]
	 */
	public function map_module_caps( $caps, $cap ) {
		return 'jetpack_manage_modules' === $cap ? array( 'manage_options' ) : $caps;
	}

	/**
	 * Gives the Stats module, which backs the sample product, a file, as the Jetpack plugin ships one.
	 *
	 * @param string $path Path to the module's file.
	 * @param string $slug Module slug.
	 * @return string
	 */
	public function ship_stats_module( $path, $slug ) {
		return 'stats' === $slug ? __FILE__ : $path;
	}

	/**
	 * Removes the Stats module, as a site filtering it away does.
	 *
	 * @param array $modules Map of available module slug to the version that introduced it.
	 * @return array
	 */
	public function remove_stats_module( $modules ) {
		unset( $modules['stats'] );

		return $modules;
	}

	/**
	 * Reports the sample module as one this site has, off the Jetpack plugin.
	 *
	 * @param array $modules Available module slugs.
	 * @return array
	 */
	public function offer_sample_module( $modules ) {
		$modules[] = 'sample-module';

		return $modules;
	}

	/**
	 * Reports the sample module as one this site has, with the Jetpack plugin loaded.
	 *
	 * @param array $modules Map of available module slug to the version that introduced it.
	 * @return array
	 */
	public function offer_sample_module_with_version( $modules ) {
		$modules['sample-module'] = '1.0';

		return $modules;
	}

	/**
	 * Makes the sample module one this site has, whichever way availability is computed.
	 *
	 * @return void
	 */
	private function offer_sample_module_either_way() {
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'offer_sample_module' ) );
		add_filter( 'jetpack_get_available_modules', array( $this, 'offer_sample_module_with_version' ) );
	}

	/**
	 * Data provider for test_activate_switches_the_module_on.
	 *
	 * @return array[] Role, whether the module switch is attempted.
	 */
	public static function provide_module_activations() {
		return array(
			'module manager' => array( 'administrator', true ),
			'no module cap'  => array( 'subscriber', false ),
		);
	}

	/**
	 * Turning a module-gated page back on switches its module, for users who may manage modules.
	 *
	 * Asserts the attempt rather than the result: whether Modules then succeeds depends on the connection, not this class.
	 *
	 * @dataProvider provide_module_activations
	 *
	 * @param string $role     Role of the current user.
	 * @param bool   $expected Whether the module switch is attempted.
	 */
	#[DataProvider( 'provide_module_activations' )]
	public function test_activate_switches_the_module_on( $role, $expected ) {
		$this->offer_sample_module_either_way();
		// Mapped as Sync maps it on a connected site.
		add_filter( 'map_meta_cap', array( $this, 'map_module_caps' ), 10, 2 );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'menu_visibility_' . $role,
					'user_pass'  => '123',
					'role'       => $role,
				)
			)
		);
		$attempted = array();
		$record    = static function ( $module ) use ( &$attempted ) {
			$attempted[] = $module;
		};
		add_action( 'jetpack_pre_activate_module', $record );

		$result = Menu_Visibility::activate( array( 'module' => 'sample-module' ) );
		remove_action( 'jetpack_pre_activate_module', $record );

		$this->assertSame( $expected ? array( 'sample-module' ) : array(), $attempted );
		if ( ! $expected ) {
			$this->assertSame( 'not_allowed', $result->get_error_code() );
		}
	}

	/**
	 * Data provider for test_feature_something_else_holds_off_is_not_offered.
	 *
	 * @return array[] What keeps the feature off.
	 */
	public static function provide_held_off_causes() {
		return array(
			'its module filtered away' => array( 'removed' ),
			'its module held off'      => array( 'module held off' ),
			'the product held off'     => array( 'product held off' ),
			'its plugin not installed' => array( 'not installed' ),
		);
	}

	/**
	 * A feature something other than its switch keeps off is still off in the sidebar, but nothing offers to turn it on.
	 *
	 * @dataProvider provide_held_off_causes
	 *
	 * @param string $cause What keeps the feature off.
	 */
	#[DataProvider( 'provide_held_off_causes' )]
	public function test_feature_something_else_holds_off_is_not_offered( $cause ) {
		if ( 'removed' === $cause && ( ! class_exists( 'Jetpack' ) || ! defined( 'JETPACK__PLUGIN_DIR' ) ) ) {
			$this->markTestSkipped( 'Needs the mock Jetpack plugin an earlier test loads.' );
		}
		Sample_Gated_Product::$active = false;
		$offer                        = static function ( $modules ) {
			return array( 'stats' => '1.0' ) + (array) $modules;
		};
		$offer_standalone             = static function ( $modules ) {
			return array_merge( (array) $modules, array( 'stats' ) );
		};
		add_filter( 'jetpack_get_available_modules', $offer );
		add_filter( 'jetpack_get_available_standalone_modules', $offer_standalone );
		$this->assertTrue( Menu_Visibility::offers( array( 'product' => 'stats' ) ), 'Offered before anything holds it off.' );

		if ( 'removed' === $cause ) {
			add_filter( 'jetpack_get_module_path', array( $this, 'ship_stats_module' ), 10, 2 );
			add_filter( 'jetpack_get_available_modules', array( $this, 'remove_stats_module' ), 20 );
		} elseif ( 'module held off' === $cause ) {
			// Never saved on, so only the filter shows it would stay off.
			add_filter( 'jetpack_active_modules', array( $this, 'remove_stats_from_active' ), 100 );
		} elseif ( 'not installed' === $cause ) {
			remove_filter( 'jetpack_get_available_modules', $offer );
			remove_filter( 'jetpack_get_available_standalone_modules', $offer_standalone );
			Sample_Gated_Product::$installed = false;
		} else {
			Sample_Gated_Product::$held_off = true;
		}

		$resolved = Menu_Visibility::resolve( array( 'product' => 'stats' ) );
		$offered  = Menu_Visibility::offers( array( 'product' => 'stats' ) );
		$result   = Menu_Visibility::activate( array( 'product' => 'stats' ) );
		remove_filter( 'jetpack_get_available_modules', $offer );
		remove_filter( 'jetpack_get_available_standalone_modules', $offer_standalone );
		remove_filter( 'jetpack_active_modules', array( $this, 'remove_stats_from_active' ), 100 );

		$this->assertFalse( $resolved, 'The sidebar still hides it.' );
		$this->assertFalse( $offered );
		$this->assertSame( 'not_available', $result->get_error_code() );
	}

	/**
	 * The admin shell offers only features the Features tab lists, so a page gated on an unlisted module keeps its own way back on.
	 */
	public function test_shell_offers_only_features_the_features_tab_lists() {
		$this->assertTrue( Menu_Visibility::offers( array( 'product' => 'stats' ) ) );
		$this->assertFalse( Menu_Visibility::offers( array( 'module' => 'seo-tools' ) ) );
	}

	/**
	 * Holds the Stats module off, as a host's `jetpack_active_modules` callback does.
	 *
	 * @param array $modules Active module slugs.
	 * @return array
	 */
	public function remove_stats_from_active( $modules ) {
		return array_values( array_diff( (array) $modules, array( 'stats' ) ) );
	}

	/**
	 * Data provider for test_activate_reaches_the_product_only_when_its_module_was_not_enough.
	 *
	 * @return array[] Whether the product reads on after its module is, whether its plugin is installed, how often Product::activate() is reached.
	 */
	public static function provide_product_fallbacks() {
		return array(
			'module was enough'        => array( true, true, 0 ),
			'product still off'        => array( false, true, 1 ),
			'its plugin not installed' => array( false, false, 0 ),
		);
	}

	/**
	 * Turning a product on switches its module and stops there once that turns the product on;
	 * Product::activate() would install a standalone plugin a Jetpack site doesn't need.
	 *
	 * @dataProvider provide_product_fallbacks
	 *
	 * @param bool $on_after_module Whether the product reads on once its module is.
	 * @param bool $installed       Whether the product's plugin is installed.
	 * @param int  $expected        How often Product::activate() is reached.
	 */
	#[DataProvider( 'provide_product_fallbacks' )]
	public function test_activate_reaches_the_product_only_when_its_module_was_not_enough( $on_after_module, $installed, $expected ) {
		$stats        = static function ( $modules ) {
			return array_merge( (array) $modules, array( 'stats' ) );
		};
		$stats_by_ver = static function ( $modules ) {
			return array( 'stats' => '1.0' ) + (array) $modules;
		};
		add_filter( 'jetpack_get_available_standalone_modules', $stats );
		add_filter( 'jetpack_get_available_modules', $stats_by_ver );
		// Already on, so switch_module() succeeds without Modules::activate(), which needs a connection here.
		add_filter( 'jetpack_active_modules', $stats );
		add_filter( 'map_meta_cap', array( $this, 'map_module_caps' ), 10, 2 );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'menu_visibility_fallback',
					'user_pass'  => '123',
					'role'       => 'administrator',
				)
			)
		);
		Sample_Gated_Product::$active    = $on_after_module;
		Sample_Gated_Product::$installed = $installed;

		$result = Menu_Visibility::activate( array( 'product' => 'stats' ) );
		remove_filter( 'jetpack_get_available_standalone_modules', $stats );
		remove_filter( 'jetpack_get_available_modules', $stats_by_ver );
		remove_filter( 'jetpack_active_modules', $stats );

		$this->assertSame( $installed ? true : 'not_available', is_wp_error( $result ) ? $result->get_error_code() : $result );
		$this->assertSame( $expected, Sample_Gated_Product::$activation_attempts );
	}

	/**
	 * A hybrid product whose standalone plugin is missing is not offered, even with the Jetpack plugin installed but off.
	 *
	 * Product::activate() would install the standalone plugin from WordPress.org.
	 */
	public function test_hybrid_product_without_its_own_plugin_is_not_offered() {
		$jetpack_only = static function () {
			return array( 'jetpack/jetpack.php' => array( 'Name' => 'Jetpack' ) );
		};
		add_filter( 'all_plugins', $jetpack_only );
		update_option( 'active_plugins', array() );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'menu_visibility_hybrid',
					'user_pass'  => '123',
					'role'       => 'administrator',
				)
			)
		);
		$requests      = 0;
		$count_request = function () use ( &$requests ) {
			++$requests;
			return new \WP_Error( 'http_request_failed', 'No request expected.' );
		};
		add_filter( 'pre_http_request', $count_request );

		$installed = Videopress::is_plugin_installed();
		$on_offer  = in_array( 'videopress', ( new Modules() )->get_available(), true );
		$offered   = Menu_Visibility::can_offer( array( 'product' => 'videopress' ) );
		$result    = Menu_Visibility::activate( array( 'product' => 'videopress' ) );
		remove_filter( 'pre_http_request', $count_request );
		remove_filter( 'all_plugins', $jetpack_only );

		$this->assertTrue( $installed, 'The hybrid product has to read as installed off the Jetpack plugin for this test to mean anything.' );
		$this->assertFalse( $on_offer, 'Its module has to be out of reach for this test to mean anything.' );
		$this->assertFalse( $offered );
		$this->assertSame( 'not_available', is_wp_error( $result ) ? $result->get_error_code() : $result );
		$this->assertSame( 0, $requests );
	}

	/**
	 * A product declaration wins over a module declaration on the same item.
	 */
	public function test_product_takes_precedence_over_module() {
		Sample_Gated_Product::$active = false;
		$this->offer_sample_module_either_way();
		add_filter( 'jetpack_active_modules', array( $this, 'activate_sample_module' ) );

		$this->assertTrue(
			Menu_Visibility::resolve( array( 'module' => 'sample-module' ) ),
			'The module has to read as active for this test to mean anything.'
		);
		$this->assertFalse(
			Menu_Visibility::resolve(
				array(
					'product' => 'stats',
					'module'  => 'sample-module',
				)
			)
		);
	}

	/**
	 * A product whose plan has lapsed keeps its item, and resolving it never asks WordPress.com.
	 */
	public function test_lapsed_plan_keeps_the_item_without_a_wpcom_request() {
		$plugin_dir = WP_PLUGIN_DIR . '/' . Backup::$plugin_slug;
		if ( ! file_exists( $plugin_dir ) ) {
			mkdir( $plugin_dir, 0777, true );
		}
		copy( __DIR__ . '/assets/backup-mock-plugin.txt', $plugin_dir . '/jetpack-backup.php' );
		wp_cache_delete( 'plugins', 'plugins' );
		activate_plugins( 'jetpack-backup/jetpack-backup.php' );

		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );

		$requests      = 0;
		$count_request = function () use ( &$requests ) {
			++$requests;
			return new \WP_Error( 'http_request_failed', 'No plan lookup expected.' );
		};
		add_filter( 'pre_http_request', $count_request );

		$resolved             = Menu_Visibility::resolve( array( 'product' => 'backup' ) );
		$requests_for_resolve = $requests;
		$is_active            = Backup::is_active();

		remove_filter( 'pre_http_request', $count_request );
		deactivate_plugins( 'jetpack-backup/jetpack-backup.php' );

		$this->assertTrue( $resolved );
		$this->assertSame( 0, $requests_for_resolve );
		$this->assertFalse( $is_active, 'With no plan, is_active() is what would have hidden the item.' );
	}

	/**
	 * Deactivating a product removes the sidebar item that declared it.
	 *
	 * Goes through Initializer::init() rather than Menu_Visibility::init(), so dropping the
	 * resolver's registration from My Jetpack's startup fails this test.
	 */
	public function test_deactivating_a_product_removes_its_menu_item() {
		global $wp_actions;

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'menu_visibility_admin',
					'user_pass'  => '123',
					'role'       => 'administrator',
				)
			)
		);
		unset( $wp_actions['my_jetpack_init'] );
		Initializer::init();

		Admin_Menu::add_menu( 'Stats', 'Stats', 'manage_options', 'gated-stats', '__return_null', null, array( 'product' => 'stats' ) );

		Sample_Gated_Product::$active = true;
		$this->assertContains( 'gated-stats', $this->register_menu() );

		Sample_Gated_Product::$active = false;
		$this->assertNotContains( 'gated-stats', $this->register_menu() );
	}

	/**
	 * Runs menu registration from scratch and returns the slugs it produced.
	 *
	 * @return array
	 */
	private function register_menu() {
		$this->reset_submenu();

		do_action( 'admin_menu' );
		ob_start(); // Core prints head markup on admin_head.
		do_action( 'admin_head' );
		ob_end_clean();

		global $submenu;

		return array_column( $submenu['jetpack'] ?? array(), 2 );
	}

	/**
	 * Empties the registered submenu so a second registration pass starts clean.
	 *
	 * @return void
	 */
	private function reset_submenu() {
		global $submenu;

		$submenu = array();
	}
}
