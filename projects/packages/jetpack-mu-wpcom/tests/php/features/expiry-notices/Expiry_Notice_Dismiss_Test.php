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

	private function expired_state( int $expiry_ts ): array {
		return array(
			'state'     => Expiry_Data::STATE_EXPIRED,
			'expiry_ts' => $expiry_ts,
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

	public function test_is_dismissed_is_false_without_a_stored_dismissal(): void {
		$user_id = $this->make_admin( 'never_dismissed' );
		$this->assertFalse( Expiry_Notice_Dismiss::is_dismissed( $user_id, Expiry_Notice_Dismiss::META_BANNER ) );
	}

	public function test_is_dismissed_is_true_once_stored(): void {
		$user_id = $this->make_admin( 'has_dismissed' );
		update_user_meta( $user_id, Expiry_Notice_Dismiss::META_BANNER, self::NOW );
		$this->assertTrue( Expiry_Notice_Dismiss::is_dismissed( $user_id, Expiry_Notice_Dismiss::META_BANNER ) );
	}

	public function test_dismissal_does_not_lapse_within_the_term(): void {
		$user_id = $this->make_admin( 'dismissed_long_ago' );
		// Dismissed a year ago, against a term that expired before that. Nothing
		// has renewed since, so there is still nothing new to say.
		update_user_meta( $user_id, Expiry_Notice_Dismiss::META_BANNER, self::NOW - YEAR_IN_SECONDS );
		$this->assertFalse(
			Expiry_Notice_Dismiss::should_show_banner(
				$this->expired_state( self::NOW - YEAR_IN_SECONDS - DAY_IN_SECONDS ),
				$user_id
			)
		);
	}

	public function test_dismissal_of_an_earlier_term_does_not_carry_over(): void {
		$user_id = $this->make_admin( 'dismissed_earlier_term' );
		// Dismissed while a previous purchase was reverted. The site renewed and
		// has lapsed again since, which the user has not been told about.
		update_user_meta( $user_id, Expiry_Notice_Dismiss::META_BANNER, self::NOW - YEAR_IN_SECONDS );
		$this->assertTrue(
			Expiry_Notice_Dismiss::should_show_banner( $this->expired_state( self::NOW ), $user_id )
		);
	}

	public function test_dismissal_of_the_current_term_stays_down(): void {
		$user_id = $this->make_admin( 'dismissed_current_term' );
		// Nothing is dismissible until the revert, 30 days past expiry, so a
		// dismissal of this term is always stamped after the term's own expiry.
		update_user_meta( $user_id, Expiry_Notice_Dismiss::META_BANNER, self::NOW + 30 * DAY_IN_SECONDS );
		$this->assertFalse(
			Expiry_Notice_Dismiss::should_show_banner( $this->expired_state( self::NOW ), $user_id )
		);
	}

	public function test_modal_dismissal_resets_per_term_too(): void {
		$user_id = $this->make_admin( 'modal_earlier_term' );
		update_user_meta( $user_id, Expiry_Notice_Dismiss::META_MODAL, self::NOW - YEAR_IN_SECONDS );
		$this->assertTrue(
			Expiry_Notice_Dismiss::should_show_modal( $this->expired_state( self::NOW ), $user_id )
		);
	}

	public function test_a_state_without_an_expiry_counts_any_dismissal(): void {
		$user_id = $this->make_admin( 'state_without_expiry' );
		update_user_meta( $user_id, Expiry_Notice_Dismiss::META_BANNER, self::NOW - YEAR_IN_SECONDS );
		// No term to judge the stamp against. Leaving a closed notice closed is
		// the safer half of the guess.
		$this->assertFalse(
			Expiry_Notice_Dismiss::should_show_banner(
				array( 'state' => Expiry_Data::STATE_EXPIRED ),
				$user_id
			)
		);
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
		$this->assertTrue( Expiry_Notice_Dismiss::should_show_banner( $this->state( 45 ), $user_id ) );
	}

	public function test_the_notice_and_modal_dismissals_are_stored_separately(): void {
		// The notice dismisses per surface and the modal dismisses everywhere, so
		// sharing a key would make one silence the other.
		$this->assertNotSame( Expiry_Notice_Dismiss::META_BANNER, Expiry_Notice_Dismiss::META_MODAL );
	}

	public function test_the_wp_admin_notice_dismissal_key_is_surface_scoped(): void {
		// Dismissing the reverted-site notice in the hosting dashboard must leave
		// wp-admin's showing, so the key can't be a generic platform-wide one.
		$this->assertStringEndsWith( '_wp_admin', Expiry_Notice_Dismiss::META_BANNER );
	}

	public function test_register_user_meta_registers_both_dismiss_keys(): void {
		Expiry_Notice_Dismiss::register_user_meta();
		$registered = get_registered_meta_keys( 'user' );
		$this->assertArrayHasKey( Expiry_Notice_Dismiss::META_BANNER, $registered );
		$this->assertArrayHasKey( Expiry_Notice_Dismiss::META_MODAL, $registered );
		$this->assertArrayHasKey( Expiry_Notice_Dismiss::META_MODAL_GRACE, $registered );
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
				0
			)
		);
	}

	public function test_should_show_modal_uses_modal_meta_not_banner(): void {
		$user_id = $this->make_admin( 'modal_dismiss_test' );
		$state   = array( 'state' => Expiry_Data::STATE_EXPIRED );
		// Banner-key dismiss must not silence the modal.
		update_user_meta( $user_id, Expiry_Notice_Dismiss::META_BANNER, self::NOW - 1 );
		$this->assertTrue( Expiry_Notice_Dismiss::should_show_modal( $state, $user_id ) );
		update_user_meta( $user_id, Expiry_Notice_Dismiss::META_MODAL, self::NOW - DAY_IN_SECONDS );
		$this->assertFalse( Expiry_Notice_Dismiss::should_show_modal( $state, $user_id ) );
	}

	private function grace_state( int $expiry_ts ): array {
		return array(
			'state'     => Expiry_Data::STATE_EXPIRED_GRACE,
			'expiry_ts' => $expiry_ts,
		);
	}

	public function test_the_modal_only_speaks_to_a_lapsed_site(): void {
		// The banner carries every stage before expiry; the modal carries none of
		// them, so `should_show_modal` can't fall through to true the way the
		// not-yet-dismissible states do for the banner.
		foreach ( array( Expiry_Data::STATE_ACTIVE, Expiry_Data::STATE_APPROACHING ) as $state ) {
			$this->assertFalse(
				Expiry_Notice_Dismiss::should_show_modal( array( 'state' => $state ), 0 ),
				"expected no modal in {$state}"
			);
		}
	}

	public function test_a_grace_dismissal_lapses_after_the_ttl(): void {
		$user_id = $this->make_admin( 'grace_ttl' );
		$state   = $this->grace_state( time() - 5 * DAY_IN_SECONDS );

		update_user_meta( $user_id, Expiry_Notice_Dismiss::META_MODAL_GRACE, time() );
		$this->assertFalse( Expiry_Notice_Dismiss::should_show_modal( $state, $user_id ) );

		update_user_meta(
			$user_id,
			Expiry_Notice_Dismiss::META_MODAL_GRACE,
			time() - ( Expiry_Notice_Dismiss::MODAL_GRACE_DISMISS_TTL + HOUR_IN_SECONDS )
		);
		$this->assertTrue( Expiry_Notice_Dismiss::should_show_modal( $state, $user_id ) );
	}

	public function test_a_post_grace_dismissal_never_lapses(): void {
		$user_id = $this->make_admin( 'post_grace_no_ttl' );
		$state   = $this->expired_state( time() - 40 * DAY_IN_SECONDS );
		// Far older than the grace TTL, which must not apply here: the revert has
		// happened and saying so once is enough.
		update_user_meta( $user_id, Expiry_Notice_Dismiss::META_MODAL, time() - 30 * DAY_IN_SECONDS );
		$this->assertFalse( Expiry_Notice_Dismiss::should_show_modal( $state, $user_id ) );
	}

	public function test_a_grace_dismissal_does_not_bury_the_post_grace_modal(): void {
		$user_id   = $this->make_admin( 'grace_then_post_grace' );
		$expiry_ts = time() - 40 * DAY_IN_SECONDS;
		// Dismissed during grace, so stamped after the term's own expiry -- which
		// is exactly what the post-grace check looks for. Separate keys are what
		// stop that from hiding a modal the user has never seen.
		update_user_meta( $user_id, Expiry_Notice_Dismiss::META_MODAL_GRACE, $expiry_ts + DAY_IN_SECONDS );
		$this->assertTrue( Expiry_Notice_Dismiss::should_show_modal( $this->expired_state( $expiry_ts ), $user_id ) );
	}

	public function test_a_grace_dismissal_of_an_earlier_term_does_not_carry_over(): void {
		$user_id = $this->make_admin( 'grace_earlier_term' );
		// Recent enough to be inside the TTL, but recorded against a term that has
		// since renewed and lapsed again.
		update_user_meta( $user_id, Expiry_Notice_Dismiss::META_MODAL_GRACE, time() - HOUR_IN_SECONDS );
		$this->assertTrue(
			Expiry_Notice_Dismiss::should_show_modal( $this->grace_state( time() - 60 ), $user_id )
		);
	}

	public function test_modal_meta_key_matches_the_state(): void {
		$this->assertSame(
			Expiry_Notice_Dismiss::META_MODAL_GRACE,
			Expiry_Notice_Dismiss::modal_meta_key( array( 'state' => Expiry_Data::STATE_EXPIRED_GRACE ) )
		);
		$this->assertSame(
			Expiry_Notice_Dismiss::META_MODAL,
			Expiry_Notice_Dismiss::modal_meta_key( array( 'state' => Expiry_Data::STATE_EXPIRED ) )
		);
		$this->assertNull(
			Expiry_Notice_Dismiss::modal_meta_key( array( 'state' => Expiry_Data::STATE_APPROACHING ) )
		);
	}
}
