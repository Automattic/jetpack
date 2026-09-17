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

/**
 * Class Jetpack_Activity_Log_Module_Test
 */
class Jetpack_Activity_Log_Module_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Loading the module file bootstraps the package. Jetpack::load_modules()
	 * only loads it while the module is active, so this is what ties the admin
	 * page and REST routes to the toggle.
	 */
	public function test_module_file_bootstraps_the_package() {
		ob_start();
		require JETPACK__PLUGIN_DIR . 'modules/activity-log.php';
		$this->assertSame( '', ob_get_clean() );

		$this->assertNotFalse(
			has_action( 'admin_menu', array( Jetpack_Activity_Log::class, 'add_wp_admin_submenu' ) )
		);
		$this->assertNotFalse(
			has_action( 'rest_api_init', array( Jetpack_Activity_Log::class, 'register_rest_routes' ) )
		);
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
