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
		$config = is_array( $config ) ? $config : array();

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
	 * Assert that a string matches a regex pattern.
	 *
	 * @param string $pattern Regex pattern.
	 * @param string $string  String to check.
	 */
	private function assert_string_matches_pattern( $pattern, $string ) {
		$this->assertSame( 1, preg_match( $pattern, $string ) );
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
		// The lead-in introduces the single Privacy Policy link.
		$this->assert_string_matches_pattern( '/Learn more in our\\s*<a [^>]*>\\s*Privacy Policy\\s*<\\/a>\\./', $html );
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
		$this->assert_string_matches_pattern(
			$links_pattern,
			$html
		);
	}

	/**
	 * A top-level cookie_policy_url is ignored; only links.cookie_policy_url is read.
	 */
	public function test_top_level_cookie_policy_url_is_ignored() {
		$this->set_privacy_policy_page();

		$html = $this->render_template(
			array(
				'cookie_policy_url' => 'https://example.com/top-level-cookies/',
			)
		);

		$this->assertStringNotContainsString( 'Cookie Policy', $html );
		$this->assertStringNotContainsString( 'href="https://example.com/top-level-cookies/"', $html );
		$this->assert_string_matches_pattern( '/Privacy Policy\\s*<\\/a>\\s*\\./', $html );
	}

	/**
	 * Whitespace-only cookie policy URLs are trimmed away and hide the Cookie Policy link.
	 */
	public function test_whitespace_only_cookie_policy_url_hides_cookie_policy_link() {
		$this->set_privacy_policy_page();

		$html = $this->render_template(
			array(
				'links' => array(
					'cookie_policy_url' => "   \t\n",
				),
			)
		);

		$this->assertStringContainsString( 'Privacy Policy', $html );
		$this->assertStringNotContainsString( 'Cookie Policy', $html );
		$this->assert_string_matches_pattern( '/Privacy Policy\\s*<\\/a>\\./', $html );
	}

	/**
	 * With no Privacy Policy page and no cookie policy URL, no policy link is rendered
	 * and the modal never emits a dead href="" link.
	 */
	public function test_missing_privacy_policy_page_renders_no_dead_link() {
		$html = $this->render_template(
			array(
				'links' => array(
					'cookie_policy_url' => '',
				),
			)
		);

		$this->assertStringNotContainsString( '<a href=""', $html );
		$this->assertStringNotContainsString( 'jetpack-cookie-consent__link', $html );
		// With no links to introduce, the "Learn more in our" lead-in must not render either.
		$this->assertStringNotContainsString( 'Learn more in our', $html );
		$this->assert_string_matches_pattern( '/settings below\\.\\s*<\\/p>/', $html );
	}

	/**
	 * With no Privacy Policy page set, a configured cookie policy URL renders as the only
	 * link, without a dead Privacy Policy link or a leading conjunction.
	 */
	public function test_missing_privacy_policy_page_renders_only_cookie_link() {
		$html = $this->render_template(
			array(
				'links' => array(
					'cookie_policy_url' => 'https://example.com/cookies/',
				),
			)
		);

		$this->assertStringContainsString( 'Cookie Policy', $html );
		$this->assertStringContainsString( 'href="https://example.com/cookies/"', $html );
		$this->assertStringNotContainsString( '<a href=""', $html );
		$this->assertStringNotContainsString( 'Privacy Policy', $html );
	}
}
