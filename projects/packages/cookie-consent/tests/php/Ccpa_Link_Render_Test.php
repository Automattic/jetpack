<?php
/**
 * Tests for Cookie_Consent::add_ccpa_interactivity_directives().
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversMethod;

/**
 * @covers \Automattic\Jetpack\CookieConsent\Cookie_Consent::add_ccpa_interactivity_directives
 */
#[CoversMethod( Cookie_Consent::class, 'add_ccpa_interactivity_directives' )]
class Ccpa_Link_Render_Test extends TestCase {

	const HTML = '<ul><li><a href="/your-privacy-choices">Your Privacy Choices</a></li></ul>';

	private function ccpa_block() {
		return array(
			'attrs' => array(
				'metadata' => array( 'name' => 'jetpack-cookie-consent-ccpa-privacy-link' ),
			),
		);
	}

	/**
	 * A non-CCPA block is returned untouched.
	 */
	public function test_passes_through_other_blocks() {
		$block = array( 'attrs' => array() );
		$this->assertSame( self::HTML, Cookie_Consent::add_ccpa_interactivity_directives( self::HTML, $block ) );
	}

	/**
	 * The CCPA link is suppressed when its page no longer exists.
	 */
	public function test_suppresses_link_when_page_missing() {
		// No jetpack_cookie_consent_ccpa_page_id option set.
		$this->assertSame( '', Cookie_Consent::add_ccpa_interactivity_directives( self::HTML, $this->ccpa_block() ) );
	}

	/**
	 * The CCPA link is suppressed when the option points to a deleted page.
	 */
	public function test_suppresses_link_when_page_deleted() {
		update_option( 'jetpack_cookie_consent_ccpa_page_id', 99999 ); // ID that no longer exists.
		$this->assertSame( '', Cookie_Consent::add_ccpa_interactivity_directives( self::HTML, $this->ccpa_block() ) );
	}

	/**
	 * The CCPA link is suppressed when the page is trashed (not yet permanently deleted).
	 */
	public function test_suppresses_link_when_page_trashed() {
		$page_id = wp_insert_post(
			array(
				'post_title'  => 'Your Privacy Choices',
				'post_status' => 'trash',
				'post_type'   => 'page',
			)
		);
		update_option( 'jetpack_cookie_consent_ccpa_page_id', $page_id );
		$this->assertSame( '', Cookie_Consent::add_ccpa_interactivity_directives( self::HTML, $this->ccpa_block() ) );
	}

	/**
	 * The CCPA link still renders (with directives) when its page exists.
	 */
	public function test_renders_link_when_page_exists() {
		$page_id = wp_insert_post(
			array(
				'post_title'  => 'Your Privacy Choices',
				'post_status' => 'publish',
				'post_type'   => 'page',
			)
		);
		update_option( 'jetpack_cookie_consent_ccpa_page_id', $page_id );

		$out = Cookie_Consent::add_ccpa_interactivity_directives( self::HTML, $this->ccpa_block() );
		$this->assertStringContainsString( 'data-wp-interactive', $out );
	}
}
