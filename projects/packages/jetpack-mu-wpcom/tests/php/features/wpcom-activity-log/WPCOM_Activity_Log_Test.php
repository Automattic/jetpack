<?php
/**
 * Test class for wpcom-activity-log.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Modules;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-activity-log/wpcom-activity-log.php';

/**
 * Class WPCOM_Activity_Log_Test
 */
class WPCOM_Activity_Log_Test extends \WorDBless\BaseTestCase {

	/**
	 * Wires the pin the way Jetpack_Mu_Wpcom::init() does on an Atomic site.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'jetpack_active_modules', 'wpcom_pin_activity_log_module' );
	}

	/**
	 * An Atomic site that has never switched the module on has no slug in the option, and
	 * the Jetpack plugin's default activation only reaches sites it has upgraded.
	 */
	public function test_module_is_active_without_the_option() {
		$this->assertTrue( ( new Modules() )->is_active( 'activity-log' ) );
	}

	/**
	 * The platform provides the Activity Log either way, so an opt-out recorded in the
	 * option does not take the feature away.
	 */
	public function test_module_is_active_after_an_opt_out() {
		\Jetpack_Options::update_option( 'active_modules', array( 'stats' ) );

		$this->assertTrue( ( new Modules() )->is_active( 'activity-log' ) );
	}

	/**
	 * The pin adds the slug rather than replacing the list.
	 */
	public function test_pin_leaves_the_other_active_modules_alone() {
		$modules = wpcom_pin_activity_log_module( array( 'stats', 'sso' ) );

		$this->assertSame( array( 'stats', 'sso', 'activity-log' ), $modules );
	}

	/**
	 * A site that already has the slug gets one copy of it, not two.
	 */
	public function test_pin_does_not_duplicate_an_already_active_module() {
		$modules = wpcom_pin_activity_log_module( array( 'activity-log', 'stats' ) );

		$this->assertSame( array( 'activity-log', 'stats' ), $modules );
	}
}
