<?php
/**
 * Loader tests for expiry-notices.php.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/expiry-notices.php';

class Loader_Test extends \WorDBless\BaseTestCase {

	public function tear_down() {
		unregister_meta_key( 'user', Expiry_Notice_Dismiss::META_BANNER );
		unregister_meta_key( 'user', Expiry_Notice_Dismiss::META_MODAL );
		parent::tear_down();
	}

	public function test_registers_meta_in_admin_context(): void {
		set_current_screen( 'dashboard' );
		$this->assertTrue( is_admin() );

		wpcom_expiry_notices_register_meta();

		$registered = get_registered_meta_keys( 'user' );
		$this->assertArrayHasKey( Expiry_Notice_Dismiss::META_BANNER, $registered );
		$this->assertArrayHasKey( Expiry_Notice_Dismiss::META_MODAL, $registered );

		set_current_screen( 'front' );
	}

	public function test_skips_outside_admin_and_rest(): void {
		set_current_screen( 'front' );
		$this->assertFalse( is_admin() );
		if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
			$this->markTestSkipped( 'REST_REQUEST is set; this test only validates the no-context skip path.' );
		}

		wpcom_expiry_notices_register_meta();

		$registered = get_registered_meta_keys( 'user' );
		$this->assertArrayNotHasKey( Expiry_Notice_Dismiss::META_BANNER, $registered );
		$this->assertArrayNotHasKey( Expiry_Notice_Dismiss::META_MODAL, $registered );
	}
}
