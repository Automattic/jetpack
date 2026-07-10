<?php
/**
 * Tests that the CCPA footer link is gated on the `ccpa_page` feature toggle,
 * not merely on the opt-out page existing.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversMethod;

/**
 * @covers \Automattic\Jetpack\CookieConsent\Cookie_Consent::register_footer_navigation_links
 */
#[CoversMethod( Cookie_Consent::class, 'register_footer_navigation_links' )]
class Ccpa_Footer_Link_Toggle_Test extends TestCase {

	public function tearDown(): void {
		$this->reset_cookie_consent_config();
		parent::tearDown();
	}

	/**
	 * Publish a CCPA page so register_footer_navigation_links() would otherwise inject its link.
	 */
	private function publish_ccpa_page() {
		$page_id = wp_insert_post(
			array(
				'post_title'  => 'Your Privacy Choices',
				'post_status' => 'publish',
				'post_type'   => 'page',
			)
		);
		update_option( 'jetpack_cookie_consent_ccpa_page_id', $page_id );
	}

	/**
	 * Register footer nav links in a footer template part (no Privacy Policy page set, so the
	 * only variable is the CCPA link; the GDPR "Manage Preferences" link is always registered).
	 *
	 * @return array Registered hooked block types.
	 */
	private function register_footer_links() {
		return Cookie_Consent::register_footer_navigation_links(
			array(),
			'last_child',
			'core/navigation',
			array( 'slug' => 'theme//footer' )
		);
	}

	/**
	 * With `ccpa_page` on and a published page, the CCPA link is registered alongside the
	 * always-present GDPR "Manage Preferences" link.
	 */
	public function test_ccpa_page_on_registers_ccpa_footer_link() {
		$this->publish_ccpa_page();
		$this->set_cookie_consent_config( array( 'features' => array( 'ccpa_page' => true ) ) );

		// CCPA link + GDPR Manage Preferences link.
		$this->assertCount( 2, $this->register_footer_links() );
	}

	/**
	 * With `ccpa_page` off, the CCPA link is NOT registered even when the page exists —
	 * its region-gating directives and page-list exclusion live in the ccpa_page branch,
	 * so surfacing the link here would render an unguarded, always-visible dead link.
	 */
	public function test_ccpa_page_off_omits_ccpa_footer_link() {
		$this->publish_ccpa_page();
		$this->set_cookie_consent_config( array( 'features' => array( 'ccpa_page' => false ) ) );

		// Only the GDPR Manage Preferences link registers.
		$this->assertCount( 1, $this->register_footer_links() );
	}
}
