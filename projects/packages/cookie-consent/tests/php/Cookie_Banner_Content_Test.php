<?php
/**
 * Tests for the cookie banner template.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversNothing;

/**
 * @coversNothing
 */
#[CoversNothing]
class Cookie_Banner_Content_Test extends TestCase {

	/**
	 * Render the banner template with the supplied config.
	 *
	 * @param array $config Cookie consent configuration.
	 * @return string Rendered template HTML.
	 */
	private function render_template( $config ) {
		ob_start();
		include dirname( __DIR__, 2 ) . '/src/cookie-banner-content.php';
		return ob_get_clean();
	}

	/**
	 * Create and configure a published Privacy Policy page.
	 */
	private function set_privacy_policy_page() {
		$page_id = wp_insert_post(
			array(
				'post_title'  => 'Privacy Policy',
				'post_status' => 'publish',
				'post_type'   => 'page',
			)
		);
		update_option( 'wp_page_for_privacy_policy', $page_id );
	}

	/**
	 * Empty cookie policy URLs hide the Cookie Policy link.
	 */
	public function test_empty_cookie_policy_url_hides_cookie_policy_link() {
		$this->set_privacy_policy_page();

		$html = $this->render_template(
			array(
				'links' => array(
					'cookie_policy_url' => '',
				),
			)
		);

		$this->assertStringContainsString( 'Privacy Policy', $html );
		$this->assertStringNotContainsString( 'Cookie Policy', $html );
		$this->assertStringNotContainsString( 'automattic.com/cookies', $html );
		$this->assertMatchesRegularExpression( '/Privacy Policy\\s*<\\/a>\\./', $html );
	}

	/**
	 * Explicit cookie policy URLs render the Cookie Policy link and conjunction.
	 */
	public function test_explicit_cookie_policy_url_renders_cookie_policy_link() {
		$this->set_privacy_policy_page();

		$html = $this->render_template(
			array(
				'links' => array(
					'cookie_policy_url' => 'https://example.com/cookies/',
				),
			)
		);

		$this->assertStringContainsString( 'Privacy Policy', $html );
		$this->assertStringContainsString( 'Cookie Policy', $html );
		$this->assertStringContainsString( 'href="https://example.com/cookies/"', $html );
		$links_pattern = '/Privacy Policy\\s*<\\/a>\\s+and\\s+'
			. '<a href="https:\\/\\/example\\.com\\/cookies\\/"[^>]*>\\s*'
			. 'Cookie Policy\\s*<\\/a>\\./';
		$this->assertMatchesRegularExpression(
			$links_pattern,
			$html
		);
	}

	/**
	 * Legacy top-level cookie_policy_url values still render the Cookie Policy link.
	 */
	public function test_legacy_cookie_policy_url_renders_cookie_policy_link() {
		$this->set_privacy_policy_page();

		$html = $this->render_template(
			array(
				'cookie_policy_url' => 'https://example.com/legacy-cookies/',
			)
		);

		$this->assertStringContainsString( 'Cookie Policy', $html );
		$this->assertStringContainsString( 'href="https://example.com/legacy-cookies/"', $html );
	}
}
