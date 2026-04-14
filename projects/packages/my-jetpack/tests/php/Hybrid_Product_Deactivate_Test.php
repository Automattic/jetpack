<?php
/**
 * Tests for Hybrid_Product::deactivate() — covers the override that
 * deactivates the Jetpack module alongside the plugin.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\My_Jetpack\Products\Backup;
use Automattic\Jetpack\My_Jetpack\Products\Protect;
use Automattic\Jetpack\My_Jetpack\Products\Search;
use Automattic\Jetpack\My_Jetpack\Products\Social;
use Automattic\Jetpack\My_Jetpack\Products\Videopress;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversMethod;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_Error;

/**
 * Unit tests for Hybrid_Product::deactivate().
 *
 * @covers \Automattic\Jetpack\My_Jetpack\Hybrid_Product::deactivate
 */
#[CoversMethod( Hybrid_Product::class, 'deactivate' )]
class Hybrid_Product_Deactivate_Test extends TestCase {

	/**
	 * Counts invocations of the jetpack_pre_deactivate_module action,
	 * keyed by module slug.
	 *
	 * @var array<string, int>
	 */
	private $pre_deactivate_calls = array();

	/**
	 * Closure registered against jetpack_pre_deactivate_module so we can
	 * remove exactly the callback we added on tearDown.
	 *
	 * @var callable|null
	 */
	private $pre_deactivate_listener;

	/**
	 * Installs mock Jetpack plugin files, seeds the available-modules
	 * option, and registers a scoped listener on
	 * `jetpack_pre_deactivate_module` so we can count module deactivations
	 * without using `remove_all_actions()`.
	 */
	public function setUp(): void {
		parent::setUp();

		$this->install_mock_plugins();
		wp_cache_delete( 'plugins', 'plugins' );

		// Ensure JETPACK__VERSION and the mock Jetpack class are defined
		// so Modules::get_available() returns our list instead of being
		// short-circuited by the missing-Jetpack branch.
		require_once WP_PLUGIN_DIR . '/jetpack/jetpack.php';

		// Register the modules the Hybrid_Product subclasses care about
		// as "available" so Modules::get_active() doesn't filter them out.
		Jetpack_Options::update_option(
			'available_modules',
			array(
				JETPACK__VERSION => array(
					'videopress' => '1.0',
					'search'     => '1.0',
					'protect'    => '1.0',
					'publicize'  => '1.0',
				),
			)
		);

		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		$this->pre_deactivate_calls    = array();
		$this->pre_deactivate_listener = function ( $module ) {
			if ( ! isset( $this->pre_deactivate_calls[ $module ] ) ) {
				$this->pre_deactivate_calls[ $module ] = 0;
			}
			++$this->pre_deactivate_calls[ $module ];
		};
		add_action( 'jetpack_pre_deactivate_module', $this->pre_deactivate_listener );
	}

	/**
	 * Removes the scoped listener (never `remove_all_actions()`), then
	 * clears WorDBless state.
	 */
	public function tearDown(): void {
		if ( null !== $this->pre_deactivate_listener ) {
			remove_action( 'jetpack_pre_deactivate_module', $this->pre_deactivate_listener );
			$this->pre_deactivate_listener = null;
		}

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		parent::tearDown();
	}

	/**
	 * Install mock Jetpack and Videopress plugin files. The Jetpack mock
	 * defines JETPACK__VERSION (needed by Modules::get_available()); the
	 * Videopress mock lets one test assert that `parent::deactivate()`
	 * actually deactivates the standalone plugin as a side effect. The
	 * other Hybrid subclasses don't need standalone mocks — for them
	 * `deactivate_plugins()` is a no-op on an uninstalled plugin.
	 */
	private function install_mock_plugins() {
		if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack' ) ) {
			mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
		}
		if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack-videopress' ) ) {
			mkdir( WP_PLUGIN_DIR . '/jetpack-videopress', 0777, true );
		}

		copy( __DIR__ . '/assets/jetpack-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
		copy( __DIR__ . '/assets/videopress-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack-videopress/jetpack-videopress.php' );
	}

	/**
	 * Mark a module as active in the Jetpack active_modules option.
	 *
	 * @param string $module Module slug.
	 */
	private function set_module_active( $module ) {
		$active = Jetpack_Options::get_option( 'active_modules', array() );
		if ( ! in_array( $module, $active, true ) ) {
			$active[] = $module;
		}
		Jetpack_Options::update_option( 'active_modules', $active );
	}

	/**
	 * Data provider: every Hybrid_Product subclass that declares a
	 * $module_name. Guards against future subclasses (or overrides) that
	 * could silently drop the module-deactivation contract.
	 *
	 * @return array<string, array{0: class-string, 1: string}>
	 */
	public static function provide_hybrid_subclasses_with_modules() {
		return array(
			'videopress' => array( Videopress::class, 'videopress' ),
			'search'     => array( Search::class, 'search' ),
			'protect'    => array( Protect::class, 'protect' ),
			'social'     => array( Social::class, 'publicize' ),
		);
	}

	/**
	 * Every Hybrid_Product subclass with a $module_name must, when its
	 * module is active, deactivate the module as part of ::deactivate().
	 *
	 * @param class-string $class  Hybrid_Product subclass under test.
	 * @param string       $module Jetpack module slug for the subclass.
	 * @dataProvider provide_hybrid_subclasses_with_modules
	 */
	#[DataProvider( 'provide_hybrid_subclasses_with_modules' )]
	public function test_deactivate_turns_off_active_module( $class, $module ) {
		$this->set_module_active( $module );
		$this->assertTrue( ( new Modules() )->is_active( $module ) );

		$result = $class::deactivate();

		$this->assertTrue( $result );
		$this->assertFalse(
			( new Modules() )->is_active( $module ),
			"Module {$module} should be deactivated after {$class}::deactivate()."
		);
		$this->assertSame(
			1,
			$this->pre_deactivate_calls[ $module ] ?? 0,
			"Modules::deactivate() should have been invoked exactly once for {$module}."
		);
	}

	/**
	 * When the Jetpack module is already inactive, ::deactivate() must
	 * skip the module branch entirely — the is_active() gate is what
	 * prevents a spurious jetpack_pre_deactivate_module action.
	 */
	public function test_deactivate_skips_modules_deactivate_when_module_inactive() {
		$this->assertFalse( ( new Modules() )->is_active( 'videopress' ) );

		$result = Videopress::deactivate();

		$this->assertTrue( $result );
		$this->assertFalse( ( new Modules() )->is_active( 'videopress' ) );
		$this->assertArrayNotHasKey(
			'videopress',
			$this->pre_deactivate_calls,
			'Modules::deactivate() must not be called when the module was already inactive.'
		);
	}

	/**
	 * Parent deactivate() is still invoked — the standalone plugin gets
	 * deactivated as a side effect, not just the Jetpack module.
	 */
	public function test_deactivate_still_deactivates_the_plugin() {
		$plugin_filename = Videopress::get_installed_plugin_filename();
		if ( null === $plugin_filename ) {
			$this->fail( 'Precondition: Videopress mock plugin should be installed.' );
		}
		activate_plugins( $plugin_filename );
		$this->set_module_active( 'videopress' );

		$this->assertTrue( Videopress::is_standalone_plugin_active() );

		Videopress::deactivate();

		$this->assertFalse(
			Videopress::is_standalone_plugin_active(),
			'parent::deactivate() should have deactivated the standalone plugin.'
		);
	}

	/**
	 * When Modules::deactivate() fails to persist, Hybrid_Product::deactivate()
	 * surfaces the failure as a WP_Error so the REST handler can return a 400.
	 */
	public function test_deactivate_returns_wp_error_when_module_deactivate_fails() {
		$this->set_module_active( 'videopress' );

		$block_update = static function ( $new_value, $old_value ) {
			return $old_value;
		};
		add_filter( 'pre_update_option_jetpack_active_modules', $block_update, 10, 2 );

		try {
			$result = Videopress::deactivate();
		} finally {
			remove_filter( 'pre_update_option_jetpack_active_modules', $block_update, 10 );
		}

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'module_deactivation_failed', $result->get_error_code() );
	}

	/**
	 * A Hybrid_Product subclass with an empty $module_name (Backup
	 * inherits null from Product) must not touch the Modules API and
	 * must not error.
	 */
	public function test_deactivate_noop_for_module_name_empty() {
		$this->assertEmpty(
			Backup::$module_name,
			'Precondition: Backup should have an empty $module_name for this test to be meaningful.'
		);

		$result = Backup::deactivate();

		$this->assertTrue( $result );
		$this->assertSame(
			array(),
			$this->pre_deactivate_calls,
			'No module-level deactivation should fire when $module_name is empty.'
		);
	}
}
