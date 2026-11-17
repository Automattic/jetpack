<?php
/**
 * Tests for the Jetpack_Mu_Wpcom bootstrap.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Admin_UI\Admin_Shell;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
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

	/**
	 * Simple starts the admin shell and lists its flag; the bootstrap's init(), as off Simple, leaves both alone.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_init_starts_the_admin_shell_only_on_simple() {
		$this->assertFalse( has_action( 'plugins_loaded', array( Jetpack_Mu_Wpcom::class, 'load_admin_shell' ) ) );

		unset( $GLOBALS['wp_actions']['jetpack_mu_wpcom_initialized'] );
		define( 'IS_WPCOM', true );
		Jetpack_Mu_Wpcom::init();
		$this->assertSame( 10, has_action( 'plugins_loaded', array( Jetpack_Mu_Wpcom::class, 'load_admin_shell' ) ) );

		Jetpack_Mu_Wpcom::load_admin_shell();

		$this->assertNotNull( Feature_Flags::get( Admin_Shell::FLAG ) );
		$this->assertSame( 10, has_action( 'wp_ajax_' . Admin_Shell::GUEST_ACTION, array( Admin_Shell::class, 'ajax_guest_assets' ) ) );
		$this->assertNotFalse( has_action( 'admin_enqueue_scripts', array( Admin_Shell::class, 'setup' ) ) );
	}
}
