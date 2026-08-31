<?php
/**
 * Tests for the predicate both halves of the expiry-notice swap read.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/expiry-notices.php';

class Rollout_Test extends \WorDBless\BaseTestCase {

	public function tear_down() {
		remove_all_filters( 'wpcom_expiry_notices_enabled' );
		parent::tear_down();
	}

	public function test_every_site_is_on_the_new_notices(): void {
		// The rollout is finished: no share, no bucket, no per-site option.
		$this->assertTrue( wpcom_expiry_notices_is_enabled_for_site() );
	}

	public function test_the_answer_does_not_depend_on_the_site(): void {
		// Nothing site-specific is read any more, so every site answers alike.
		// Worth pinning: the swap only stays coherent while both halves get the
		// same answer for the same request.
		foreach ( array( 1, 5, 55, 100, 12345 ) as $blog_id ) {
			update_option( 'jetpack_options', array( 'id' => $blog_id ) );
			$this->assertTrue( wpcom_expiry_notices_is_enabled_for_site() );
		}
		delete_option( 'jetpack_options' );
	}

	public function test_the_retired_rollout_option_no_longer_holds_a_site_out(): void {
		// Sites still carry `wpcom_expiry_notices_enabled` from the ramp. It is
		// no longer read, so a stale value cannot strand a site on the old
		// notices. Use the filter instead.
		foreach ( array( '0', 'false', 'no', 'off', '1' ) as $stale ) {
			update_option( 'wpcom_expiry_notices_enabled', $stale );
			$this->assertTrue(
				wpcom_expiry_notices_is_enabled_for_site(),
				sprintf( 'a leftover option value of %s should be inert', var_export( $stale, true ) )
			);
		}
		delete_option( 'wpcom_expiry_notices_enabled' );
	}

	public function test_the_filter_can_still_hold_a_site_back(): void {
		// The one remaining lever, and the one the legacy notices rely on: if
		// this says a site is out, they must take over again.
		add_filter( 'wpcom_expiry_notices_enabled', '__return_false' );
		$this->assertFalse( wpcom_expiry_notices_is_enabled_for_site() );
	}
}
