<?php
/**
 * Tests for Cookie_Consent::maybe_create_ccpa_page().
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversMethod;

/**
 * Tests for the create-once behavior of the auto-created CCPA page.
 *
 * @covers \Automattic\Jetpack\CookieConsent\Cookie_Consent::maybe_create_ccpa_page
 */
#[CoversMethod( Cookie_Consent::class, 'maybe_create_ccpa_page' )]
class Maybe_Create_Ccpa_Page_Test extends TestCase {

	/**
	 * A fresh site gets a published page and the created-once flag.
	 */
	public function test_creates_page_and_sets_created_flag() {
		Cookie_Consent::maybe_create_ccpa_page();

		$page_id = (int) get_option( 'jetpack_cookie_consent_ccpa_page_id' );
		$this->assertGreaterThan( 0, $page_id );
		$this->assertNotNull( get_post( $page_id ) );
		$this->assertSame( 'publish', get_post( $page_id )->post_status );
		$this->assertSame( 1, (int) get_option( 'jetpack_cookie_consent_ccpa_page_created' ) );
	}

	/**
	 * A second call is a no-op: no duplicate page is created.
	 */
	public function test_second_call_does_not_duplicate() {
		Cookie_Consent::maybe_create_ccpa_page();
		$first_id = (int) get_option( 'jetpack_cookie_consent_ccpa_page_id' );

		Cookie_Consent::maybe_create_ccpa_page();
		$second_id = (int) get_option( 'jetpack_cookie_consent_ccpa_page_id' );

		// The stored page id must be unchanged and the created-once flag must remain set.
		$this->assertSame( $first_id, $second_id );
		$this->assertSame( 1, (int) get_option( 'jetpack_cookie_consent_ccpa_page_created' ) );
	}

	/**
	 * Once the flag is set, deleting the page does not bring it back.
	 */
	public function test_does_not_recreate_after_deletion() {
		Cookie_Consent::maybe_create_ccpa_page();
		$page_id = (int) get_option( 'jetpack_cookie_consent_ccpa_page_id' );

		wp_delete_post( $page_id, true );
		delete_option( 'jetpack_cookie_consent_ccpa_page_id' );

		Cookie_Consent::maybe_create_ccpa_page();

		$this->assertFalse( (bool) get_option( 'jetpack_cookie_consent_ccpa_page_id' ) );
		$this->assertSame( 1, (int) get_option( 'jetpack_cookie_consent_ccpa_page_created' ) );
	}

	/**
	 * The deletion lock is gone: the method no longer exists.
	 */
	public function test_deletion_lock_removed() {
		$this->assertFalse(
			method_exists( Cookie_Consent::class, 'prevent_privacy_pages_deletion' ),
			'prevent_privacy_pages_deletion() should be removed so pages are deletable.'
		);
	}

	/**
	 * Migration: a pre-existing page with no flag gets the flag backfilled.
	 */
	public function test_backfills_flag_for_existing_page() {
		$page_id = wp_insert_post(
			array(
				'post_title'  => 'Your Privacy Choices',
				'post_name'   => 'your-privacy-choices',
				'post_status' => 'publish',
				'post_type'   => 'page',
			)
		);
		update_option( 'jetpack_cookie_consent_ccpa_page_id', $page_id );
		// No created flag yet — simulates a site from before this change.

		Cookie_Consent::maybe_create_ccpa_page();

		$this->assertSame( 1, (int) get_option( 'jetpack_cookie_consent_ccpa_page_created' ) );
		$this->assertSame( (int) $page_id, (int) get_option( 'jetpack_cookie_consent_ccpa_page_id' ) );
	}

	/**
	 * A stale option id (post gone) with no flag is cleared, then a fresh page is created.
	 */
	public function test_clears_stale_id_and_recreates_when_flag_absent() {
		update_option( 'jetpack_cookie_consent_ccpa_page_id', 99999 ); // Points at nothing.
		// No created flag — this is NOT the "owner deleted it" case.

		Cookie_Consent::maybe_create_ccpa_page();

		$new_id = (int) get_option( 'jetpack_cookie_consent_ccpa_page_id' );
		$this->assertNotSame( 99999, $new_id );
		$this->assertGreaterThan( 0, $new_id );
		$this->assertNotNull( get_post( $new_id ) );
		$this->assertSame( 1, (int) get_option( 'jetpack_cookie_consent_ccpa_page_created' ) );
	}

	/**
	 * A trashed stored page still latches the created flag (create-once is permanent).
	 *
	 * Pins current behavior: the by-ID guard checks existence, not status, so a
	 * trashed page is never regenerated. The footer link is suppressed separately
	 * via ccpa_page_is_published().
	 */
	public function test_backfill_flag_set_even_when_stored_page_trashed() {
		$page_id = wp_insert_post(
			array(
				'post_title'  => 'Your Privacy Choices',
				'post_name'   => 'your-privacy-choices',
				'post_status' => 'trash',
				'post_type'   => 'page',
			)
		);
		update_option( 'jetpack_cookie_consent_ccpa_page_id', $page_id );

		Cookie_Consent::maybe_create_ccpa_page();

		$this->assertSame( 1, (int) get_option( 'jetpack_cookie_consent_ccpa_page_created' ) );
		$this->assertSame( (int) $page_id, (int) get_option( 'jetpack_cookie_consent_ccpa_page_id' ) );
	}
}
