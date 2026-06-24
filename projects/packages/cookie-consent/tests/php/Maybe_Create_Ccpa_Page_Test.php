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
		$this->assertSame( 1, get_option( 'jetpack_cookie_consent_ccpa_page_created' ) );
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
		$this->assertSame( 1, get_option( 'jetpack_cookie_consent_ccpa_page_created' ) );
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

		$this->assertSame( 1, get_option( 'jetpack_cookie_consent_ccpa_page_created' ) );
		$this->assertSame( (int) $page_id, (int) get_option( 'jetpack_cookie_consent_ccpa_page_id' ) );
	}
}
