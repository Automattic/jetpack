<?php
/**
 * Tests for Cookie_Consent::maybe_suppress_privacy_policy_link().
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversMethod;

/**
 * @covers \Automattic\Jetpack\CookieConsent\Cookie_Consent::maybe_suppress_privacy_policy_link
 */
#[CoversMethod( Cookie_Consent::class, 'maybe_suppress_privacy_policy_link' )]
class Privacy_Policy_Link_Render_Test extends TestCase {

	const HTML = '<ul><li><a href="/privacy-policy">Privacy Policy</a></li></ul>';

	private function privacy_policy_block() {
		return array(
			'attrs' => array(
				'metadata' => array( 'name' => 'jetpack-cookie-consent-privacy-policy-link' ),
			),
		);
	}

	/**
	 * A non-privacy-policy block is returned untouched.
	 */
	public function test_passes_through_other_blocks() {
		$block = array( 'attrs' => array() );
		$this->assertSame( self::HTML, Cookie_Consent::maybe_suppress_privacy_policy_link( self::HTML, $block ) );
	}

	/**
	 * The link is suppressed when no privacy policy page is configured.
	 */
	public function test_suppresses_link_when_page_missing() {
		$this->assertSame( '', Cookie_Consent::maybe_suppress_privacy_policy_link( self::HTML, $this->privacy_policy_block() ) );
	}

	/**
	 * The link is suppressed when the configured page is trashed.
	 */
	public function test_suppresses_link_when_page_trashed() {
		$page_id = wp_insert_post(
			array(
				'post_title'  => 'Privacy Policy',
				'post_status' => 'trash',
				'post_type'   => 'page',
			)
		);
		update_option( 'wp_page_for_privacy_policy', $page_id );
		$this->assertSame( '', Cookie_Consent::maybe_suppress_privacy_policy_link( self::HTML, $this->privacy_policy_block() ) );
	}

	/**
	 * The link renders unchanged when the privacy policy page is published.
	 */
	public function test_renders_link_when_page_published() {
		$page_id = wp_insert_post(
			array(
				'post_title'  => 'Privacy Policy',
				'post_status' => 'publish',
				'post_type'   => 'page',
			)
		);
		update_option( 'wp_page_for_privacy_policy', $page_id );
		$this->assertSame( self::HTML, Cookie_Consent::maybe_suppress_privacy_policy_link( self::HTML, $this->privacy_policy_block() ) );
	}
}
