<?php
/**
 * Expiry_Notice_Dismiss Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversClass;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/class-expiry-data.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/class-expiry-notice-dismiss.php';

/**
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss
 */
#[CoversClass( Expiry_Notice_Dismiss::class )]
class Expiry_Notice_Dismiss_Test extends \WorDBless\BaseTestCase {

	private const NOW = 1735689600; // 2025-01-01 00:00:00 UTC.

	private function state( int $days_remaining, ?int $grace_days_left = null ): array {
		return array(
			'state'           => Expiry_Data::STATE_APPROACHING,
			'days_remaining'  => $days_remaining,
			'grace_days_left' => $grace_days_left,
		);
	}

	private function make_admin( string $login ): int {
		return (int) wp_insert_user(
			array(
				'user_login' => $login,
				'user_pass'  => 'pass',
				'user_email' => $login . '@example.com',
				'role'       => 'administrator',
			)
		);
	}

	public function test_no_prior_dismissal_shows(): void {
		$this->assertTrue( Expiry_Notice_Dismiss::evaluate_show( null, 7 * DAY_IN_SECONDS, self::NOW ) );
	}

	public function test_recent_dismissal_within_cadence_hides(): void {
		$dismissed_at = self::NOW - DAY_IN_SECONDS;
		$this->assertFalse( Expiry_Notice_Dismiss::evaluate_show( $dismissed_at, 7 * DAY_IN_SECONDS, self::NOW ) );
	}

	public function test_old_dismissal_past_cadence_shows(): void {
		$dismissed_at = self::NOW - ( 10 * DAY_IN_SECONDS );
		$this->assertTrue( Expiry_Notice_Dismiss::evaluate_show( $dismissed_at, 7 * DAY_IN_SECONDS, self::NOW ) );
	}

	public function test_zero_cadence_means_every_session(): void {
		$this->assertTrue( Expiry_Notice_Dismiss::evaluate_show( self::NOW - 1, 0, self::NOW ) );
	}

	public function test_pre_revert_states_are_not_dismissible(): void {
		$this->assertFalse( Expiry_Notice_Dismiss::is_dismissible( $this->state( 90 ) ) );
		$this->assertFalse( Expiry_Notice_Dismiss::is_dismissible( $this->state( 45 ) ) );
		$this->assertFalse( Expiry_Notice_Dismiss::is_dismissible( $this->state( 1 ) ) );
		$this->assertFalse(
			Expiry_Notice_Dismiss::is_dismissible(
				array( 'state' => Expiry_Data::STATE_EXPIRED_GRACE )
			)
		);
	}

	public function test_post_grace_is_dismissible(): void {
		$this->assertTrue(
			Expiry_Notice_Dismiss::is_dismissible(
				array( 'state' => Expiry_Data::STATE_EXPIRED )
			)
		);
	}

	public function test_should_show_banner_ignores_dismissal_before_revert(): void {
		$user_id = $this->make_admin( 'banner_dismiss_test' );
		update_user_meta( $user_id, Expiry_Notice_Dismiss::META_BANNER, self::NOW - 1 );
		// Nothing before the revert is dismissible, so a stored dismissal from an
		// earlier stage must not silence the notice.
		$this->assertTrue( Expiry_Notice_Dismiss::should_show_banner( $this->state( 45 ), $user_id, self::NOW ) );
	}

	public function test_register_user_meta_registers_both_dismiss_keys(): void {
		Expiry_Notice_Dismiss::register_user_meta();
		$registered = get_registered_meta_keys( 'user' );
		$this->assertArrayHasKey( Expiry_Notice_Dismiss::META_BANNER, $registered );
		$this->assertArrayHasKey( Expiry_Notice_Dismiss::META_MODAL, $registered );
		$this->assertTrue( $registered[ Expiry_Notice_Dismiss::META_BANNER ]['show_in_rest'] );
		$this->assertSame( 'integer', $registered[ Expiry_Notice_Dismiss::META_BANNER ]['type'] );
	}

	public function test_register_user_meta_sanitize_returns_server_time(): void {
		Expiry_Notice_Dismiss::register_user_meta();
		$sanitize = get_registered_meta_keys( 'user' )[ Expiry_Notice_Dismiss::META_BANNER ]['sanitize_callback'];
		$before   = time();
		$result   = $sanitize( 0 );
		$after    = time();
		$this->assertGreaterThanOrEqual( $before, $result );
		$this->assertLessThanOrEqual( $after, $result );
	}

	public function test_should_show_modal_with_no_dismissal_shows(): void {
		$this->assertTrue(
			Expiry_Notice_Dismiss::should_show_modal(
				array( 'state' => Expiry_Data::STATE_EXPIRED ),
				0,
				self::NOW
			)
		);
	}

	public function test_should_show_modal_uses_modal_meta_not_banner(): void {
		$user_id = $this->make_admin( 'modal_dismiss_test' );
		$state   = array( 'state' => Expiry_Data::STATE_EXPIRED );
		// Banner-key dismiss must not silence the modal.
		update_user_meta( $user_id, Expiry_Notice_Dismiss::META_BANNER, self::NOW - 1 );
		$this->assertTrue( Expiry_Notice_Dismiss::should_show_modal( $state, $user_id, self::NOW ) );
		update_user_meta( $user_id, Expiry_Notice_Dismiss::META_MODAL, self::NOW - DAY_IN_SECONDS );
		$this->assertFalse( Expiry_Notice_Dismiss::should_show_modal( $state, $user_id, self::NOW ) );
	}
}
