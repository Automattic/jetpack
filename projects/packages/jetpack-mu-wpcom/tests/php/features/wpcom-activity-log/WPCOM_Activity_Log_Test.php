<?php
/**
 * Test class for wpcom-activity-log.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Modules;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-activity-log/wpcom-activity-log.php';

/**
 * Class WPCOM_Activity_Log_Test
 */
class WPCOM_Activity_Log_Test extends \WorDBless\BaseTestCase {

	/**
	 * Removes the filter the tests below add.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_active_modules', 'wpcom_force_activity_log_module' );

		parent::tear_down();
	}

	/**
	 * The module stays on after the site owner switches it off in the option.
	 */
	public function test_module_is_active_after_an_opt_out() {
		\Jetpack_Options::update_option( 'active_modules', array( 'stats' ) );
		add_filter( 'jetpack_active_modules', 'wpcom_force_activity_log_module' );

		$this->assertTrue( ( new Modules() )->is_active( 'activity-log' ) );
	}

	/**
	 * The filter adds the slug rather than replacing the list.
	 */
	public function test_filter_keeps_the_other_active_modules() {
		$this->assertSame(
			array( 'stats', 'sso', 'activity-log' ),
			wpcom_force_activity_log_module( array( 'stats', 'sso' ) )
		);
	}

	/**
	 * A site that already has the slug gets one copy of it.
	 */
	public function test_filter_does_not_duplicate_an_active_module() {
		$this->assertSame(
			array( 'activity-log', 'stats' ),
			wpcom_force_activity_log_module( array( 'activity-log', 'stats' ) )
		);
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_package_bootstrap_forces_the_module_on_atomic() {
		if ( ! defined( 'IS_ATOMIC' ) ) {
			define( 'IS_ATOMIC', true );
		}

		unset( $GLOBALS['wp_actions']['jetpack_mu_wpcom_initialized'] );
		Jetpack_Mu_Wpcom::init();

		$this->assertNotFalse( has_filter( 'jetpack_active_modules', 'wpcom_force_activity_log_module' ) );
	}

	/**
	 * Simple already reports every module active, and self-hosted sites keep the site owner's choice.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_package_bootstrap_leaves_the_module_alone_without_atomic() {
		unset( $GLOBALS['wp_actions']['jetpack_mu_wpcom_initialized'] );
		Jetpack_Mu_Wpcom::init();

		$this->assertFalse( has_filter( 'jetpack_active_modules', 'wpcom_force_activity_log_module' ) );
	}
}
