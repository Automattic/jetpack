<?php
/**
 * Expiry_Notice_Dismiss Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversClass;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/class-expiry-data.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/class-expiry-notice-dismiss.php';

/**
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss
 */
#[CoversClass( Expiry_Notice_Dismiss::class )]
class Expiry_Notice_Dismiss_Test extends \WorDBless\BaseTestCase {

	/**
	 * @var int
	 */
	private $user_id;

	public function set_up() {
		parent::set_up();
		$this->user_id = (int) wp_insert_user(
			array(
				'user_login' => 'dismiss_admin',
				'user_pass'  => 'pass',
				'user_email' => 'dismiss_admin@example.com',
				'role'       => 'administrator',
			)
		);
	}

	public function tear_down() {
		foreach ( array( Expiry_Notice_Dismiss::META_BANNER, Expiry_Notice_Dismiss::META_MODAL, Expiry_Notice_Dismiss::META_MODAL_GRACE ) as $meta_key ) {
			unregister_meta_key( 'user', $meta_key );
			unregister_meta_key( 'user', $GLOBALS['wpdb']->get_blog_prefix() . $meta_key );
		}
		Constants::clear_constants();
		parent::tear_down();
	}

	private function state( string $state, int $expiry_ts ): array {
		return array(
			'state'     => $state,
			'expiry_ts' => $expiry_ts,
		);
	}

	private function dismiss( string $meta_key, int $when ): void {
		update_user_meta( $this->user_id, $meta_key, $when );
	}

	public function test_a_dismissal_holds_for_its_own_term_and_not_the_next(): void {
		$expiry_ts = time() - 40 * DAY_IN_SECONDS;
		$state     = $this->state( Expiry_Data::STATE_EXPIRED, $expiry_ts );

		$this->assertTrue( Expiry_Notice_Dismiss::should_show_banner( $state, $this->user_id ) );

		$this->dismiss( Expiry_Notice_Dismiss::META_BANNER, $expiry_ts + 31 * DAY_IN_SECONDS );
		$this->assertFalse( Expiry_Notice_Dismiss::should_show_banner( $state, $this->user_id ) );

		// Stamped against a purchase that has since been renewed and lapsed again.
		$this->dismiss( Expiry_Notice_Dismiss::META_BANNER, $expiry_ts - YEAR_IN_SECONDS );
		$this->assertTrue( Expiry_Notice_Dismiss::should_show_banner( $state, $this->user_id ) );
	}

	public function test_only_the_post_grace_banner_is_dismissible(): void {
		$this->dismiss( Expiry_Notice_Dismiss::META_BANNER, time() );
		foreach ( array( Expiry_Data::STATE_APPROACHING, Expiry_Data::STATE_EXPIRED_GRACE ) as $stage ) {
			$state = $this->state( $stage, time() - DAY_IN_SECONDS );
			$this->assertFalse( Expiry_Notice_Dismiss::is_dismissible( $state ) );
			$this->assertTrue( Expiry_Notice_Dismiss::should_show_banner( $state, $this->user_id ), "a stored dismissal must not silence {$stage}" );
		}
		$this->assertTrue( Expiry_Notice_Dismiss::is_dismissible( $this->state( Expiry_Data::STATE_EXPIRED, time() - 40 * DAY_IN_SECONDS ) ) );
	}

	public function test_the_modal_only_speaks_to_a_lapsed_site_and_dismisses_to_its_own_key(): void {
		foreach ( array( Expiry_Data::STATE_ACTIVE, Expiry_Data::STATE_APPROACHING ) as $stage ) {
			$state = $this->state( $stage, time() + DAY_IN_SECONDS );
			$this->assertNull( Expiry_Notice_Dismiss::modal_meta_key( $state ) );
			$this->assertFalse( Expiry_Notice_Dismiss::should_show_modal( $state, $this->user_id ) );
		}

		$grace = $this->state( Expiry_Data::STATE_EXPIRED_GRACE, time() - 5 * DAY_IN_SECONDS );
		$this->assertSame( Expiry_Notice_Dismiss::META_MODAL_GRACE, Expiry_Notice_Dismiss::modal_meta_key( $grace ) );

		$expired = $this->state( Expiry_Data::STATE_EXPIRED, time() - 40 * DAY_IN_SECONDS );
		$this->assertSame( Expiry_Notice_Dismiss::META_MODAL, Expiry_Notice_Dismiss::modal_meta_key( $expired ) );

		$this->dismiss( Expiry_Notice_Dismiss::META_BANNER, time() );
		$this->assertTrue( Expiry_Notice_Dismiss::should_show_modal( $expired, $this->user_id ), 'the banner key must not silence the modal' );
		$this->dismiss( Expiry_Notice_Dismiss::META_MODAL, time() );
		$this->assertFalse( Expiry_Notice_Dismiss::should_show_modal( $expired, $this->user_id ) );
	}

	public function test_a_grace_dismissal_lapses_and_a_post_grace_one_never_does(): void {
		$grace = $this->state( Expiry_Data::STATE_EXPIRED_GRACE, time() - 5 * DAY_IN_SECONDS );
		$this->dismiss( Expiry_Notice_Dismiss::META_MODAL_GRACE, time() );
		$this->assertFalse( Expiry_Notice_Dismiss::should_show_modal( $grace, $this->user_id ) );
		$this->dismiss( Expiry_Notice_Dismiss::META_MODAL_GRACE, time() - ( Expiry_Notice_Dismiss::MODAL_GRACE_DISMISS_TTL + HOUR_IN_SECONDS ) );
		$this->assertTrue( Expiry_Notice_Dismiss::should_show_modal( $grace, $this->user_id ) );

		$expired = $this->state( Expiry_Data::STATE_EXPIRED, time() - 40 * DAY_IN_SECONDS );
		$this->dismiss( Expiry_Notice_Dismiss::META_MODAL, time() - 30 * DAY_IN_SECONDS );
		$this->assertFalse( Expiry_Notice_Dismiss::should_show_modal( $expired, $this->user_id ) );
	}

	public function test_a_grace_dismissal_does_not_bury_the_post_grace_modal(): void {
		$expiry_ts = time() - 40 * DAY_IN_SECONDS;
		$this->dismiss( Expiry_Notice_Dismiss::META_MODAL_GRACE, $expiry_ts + DAY_IN_SECONDS );
		$this->assertTrue( Expiry_Notice_Dismiss::should_show_modal( $this->state( Expiry_Data::STATE_EXPIRED, $expiry_ts ), $this->user_id ) );
	}

	public function test_a_grace_dismissal_of_an_earlier_term_does_not_carry_over(): void {
		// Inside the TTL, but recorded against a term that has since renewed and lapsed again.
		$this->dismiss( Expiry_Notice_Dismiss::META_MODAL_GRACE, time() - HOUR_IN_SECONDS );
		$this->assertTrue( Expiry_Notice_Dismiss::should_show_modal( $this->state( Expiry_Data::STATE_EXPIRED_GRACE, time() - 60 ), $this->user_id ) );
	}

	public function test_on_simple_a_dismissal_belongs_to_one_site(): void {
		Constants::set_constant( 'IS_WPCOM', true );
		$state = $this->state( Expiry_Data::STATE_EXPIRED, time() - 40 * DAY_IN_SECONDS );

		$this->assertSame( $GLOBALS['wpdb']->get_blog_prefix() . Expiry_Notice_Dismiss::META_BANNER, Expiry_Notice_Dismiss::banner_meta_key() );
		$this->assertStringStartsWith( $GLOBALS['wpdb']->get_blog_prefix(), (string) Expiry_Notice_Dismiss::modal_meta_key( $state ) );

		// A dismissal recorded without the site's prefix is another site's.
		$this->dismiss( Expiry_Notice_Dismiss::META_BANNER, time() );
		$this->assertTrue( Expiry_Notice_Dismiss::should_show_banner( $state, $this->user_id ) );

		$this->dismiss( Expiry_Notice_Dismiss::banner_meta_key(), time() );
		$this->assertFalse( Expiry_Notice_Dismiss::should_show_banner( $state, $this->user_id ) );

		Expiry_Notice_Dismiss::register_user_meta();
		$this->assertArrayHasKey( Expiry_Notice_Dismiss::banner_meta_key(), get_registered_meta_keys( 'user' ) );
	}

	public function test_the_dismiss_meta_is_writable_over_rest_by_admins_only_and_stamps_server_time(): void {
		Expiry_Notice_Dismiss::register_user_meta();
		$registered = get_registered_meta_keys( 'user' );

		foreach ( array( Expiry_Notice_Dismiss::META_BANNER, Expiry_Notice_Dismiss::META_MODAL, Expiry_Notice_Dismiss::META_MODAL_GRACE ) as $meta_key ) {
			$this->assertTrue( $registered[ $meta_key ]['show_in_rest'] );
			$this->assertSame( 'integer', $registered[ $meta_key ]['type'] );
		}

		$before = time();
		$stored = $registered[ Expiry_Notice_Dismiss::META_BANNER ]['sanitize_callback']( 0 );
		$this->assertGreaterThanOrEqual( $before, $stored );
		$this->assertLessThanOrEqual( time(), $stored );

		$auth = $registered[ Expiry_Notice_Dismiss::META_BANNER ]['auth_callback'];
		wp_set_current_user( $this->user_id );
		$this->assertTrue( $auth() );
		wp_set_current_user(
			(int) wp_insert_user(
				array(
					'user_login' => 'dismiss_subscriber',
					'user_pass'  => 'pass',
					'user_email' => 'dismiss_subscriber@example.com',
					'role'       => 'subscriber',
				)
			)
		);
		$this->assertFalse( $auth() );
	}
}
