<?php
/**
 * Tests for the activity-log module's header file and the hooks it registers.
 *
 * Deliberately carries no covers metadata: the module file has no class or
 * function to point an attribute at, and the generated module-headings
 * registries cache their arrays behind statics.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Activity_Log\Jetpack_Activity_Log;
use Automattic\Jetpack\Modules;

/**
 * Class Jetpack_Activity_Log_Module_Test
 */
class Jetpack_Activity_Log_Module_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Module state and the package bootstrap both outlive a single test, so
	 * unwind them rather than letting one test decide the next one's answer.
	 */
	public function set_up() {
		parent::set_up();
		$this->reset_bootstrap();
	}

	public function tear_down() {
		$this->reset_bootstrap();
		Jetpack_Options::delete_option( 'active_modules' );
		parent::tear_down();
	}

	/**
	 * Unwinds everything Jetpack_Activity_Log::initialize() leaves behind.
	 *
	 * @return void
	 */
	private function reset_bootstrap() {
		remove_action( 'admin_menu', array( Jetpack_Activity_Log::class, 'add_wp_admin_submenu' ) );
		remove_action( 'rest_api_init', array( Jetpack_Activity_Log::class, 'register_rest_routes' ) );
		unset( $GLOBALS['wp_actions']['jetpack_activity_log_initialized'] );
	}

	/**
	 * Whether the hooks that serve the admin page and the REST routes are wired.
	 *
	 * @return bool
	 */
	private function is_bootstrapped() {
		return false !== has_action( 'admin_menu', array( Jetpack_Activity_Log::class, 'add_wp_admin_submenu' ) )
			&& false !== has_action( 'rest_api_init', array( Jetpack_Activity_Log::class, 'register_rest_routes' ) );
	}

	/**
	 * Loading the module file bootstraps the package. Jetpack::load_modules()
	 * only loads it while the module is active, so this is what ties the admin
	 * page and REST routes to the toggle.
	 */
	public function test_module_file_bootstraps_the_package() {
		Jetpack_Options::update_option( 'active_modules', array( 'activity-log' ) );

		ob_start();
		require JETPACK__PLUGIN_DIR . 'modules/activity-log.php';
		$this->assertSame( '', ob_get_clean() );

		$this->assertTrue( $this->is_bootstrapped() );
	}

	/**
	 * The combination the gate exists for: a standalone plugin bootstrapping the
	 * package on a Jetpack site where the module has been switched off. Without
	 * the gate its call wins, and the page comes back despite the toggle.
	 */
	public function test_a_standalone_bootstrap_stays_unwired_while_the_module_is_off() {
		Jetpack_Options::update_option( 'active_modules', array() );
		$this->assertFalse( ( new Modules() )->is_active( 'activity-log' ) );

		Jetpack_Activity_Log::initialize();

		$this->assertFalse( $this->is_bootstrapped() );
	}

	/**
	 * Switching it back on restores them.
	 */
	public function test_a_standalone_bootstrap_wires_up_while_the_module_is_on() {
		Jetpack_Options::update_option( 'active_modules', array( 'activity-log' ) );

		Jetpack_Activity_Log::initialize();

		$this->assertTrue( $this->is_bootstrapped() );
	}

	/**
	 * The header keeps the module on by default, so existing sites do not lose
	 * the Activity Log when they upgrade.
	 */
	public function test_module_headers() {
		$i18n = jetpack_get_module_i18n( 'activity-log' );
		$this->assertIsArray( $i18n );
		$this->assertSame( 'Activity Log', $i18n['name'] );

		$info = jetpack_get_module_info( 'activity-log' );
		$this->assertIsArray( $info );
		$this->assertSame( 'Yes', $info['auto_activate'] );
		$this->assertSame( 'Yes', $info['requires_connection'] );
		$this->assertSame( 'Yes', $info['requires_user_connection'] );
	}
}
