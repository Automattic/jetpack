<?php
/**
 * Tests for the Jetpack_Mu_Wpcom bootstrap.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;

/**
 * Test class for Jetpack_Mu_Wpcom::init().
 */
class Jetpack_Mu_Wpcom_Test extends TestCase {

	/**
	 * The bootstrap's init() leaves notifications on off Atomic, and init() on Atomic turns them off.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_init_turns_threat_notifications_off_only_on_atomic() {
		$this->assertTrue( apply_filters( 'jetpack_protect_threat_notifications_enabled', true ) );

		// init() runs once per request, so let it run again as Atomic.
		unset( $GLOBALS['wp_actions']['jetpack_mu_wpcom_initialized'] );
		Constants::set_constant( 'IS_ATOMIC', true );
		Jetpack_Mu_Wpcom::init();

		$this->assertFalse( apply_filters( 'jetpack_protect_threat_notifications_enabled', true ) );
	}
}
