<?php
/**
 * Which users the package loads the expiry notices for.
 *
 * Deliberately does not require expiry-notices.php: each test asks whether the
 * loader did, so it runs in a fresh process.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

class Feature_Gate_Test extends \WorDBless\BaseTestCase {

	public function tear_down() {
		delete_option( 'is_fully_managed_agency_site' );
		parent::tear_down();
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_loads_for_an_admin_without_a_wpcom_account(): void {
		// Nothing here can name the current user as a WordPress.com account,
		// which is the case the legacy notice would otherwise keep covering.
		$this->assertFalse( is_wpcom_user() );
		$this->assertFalse( function_exists( 'wpcom_expiry_notices_is_enabled_for_site' ) );

		Jetpack_Mu_Wpcom::load_wpcom_user_features();

		$this->assertTrue( function_exists( 'wpcom_expiry_notices_is_enabled_for_site' ) );
	}

	/**
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_loads_for_agency_managed_sites(): void {
		// The client admin cannot renew the agency's plan, and is told so.
		update_option( 'is_fully_managed_agency_site', '1' );

		Jetpack_Mu_Wpcom::load_wpcom_user_features();

		$this->assertTrue( function_exists( 'wpcom_expiry_notices_is_enabled_for_site' ) );
	}
}
