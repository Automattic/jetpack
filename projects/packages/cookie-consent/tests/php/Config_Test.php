<?php
/**
 * Tests for Cookie_Consent configuration.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversMethod;

/**
 * @covers \Automattic\Jetpack\CookieConsent\Cookie_Consent::get_config
 */
#[CoversMethod( Cookie_Consent::class, 'get_config' )]
class Config_Test extends TestCase {

	/**
	 * Defaults are resolved lazily the first time get_config() is called, before init().
	 */
	public function test_get_config_returns_defaults_before_init() {
		$config = Cookie_Consent::get_config();

		$this->assertSame( 'jetpack', $config['event_prefix'] );
		$this->assertTrue( $config['features']['banner'] );
	}

	/**
	 * The default cookie policy URL is empty.
	 */
	public function test_cookie_policy_url_defaults_to_empty() {
		$config = Cookie_Consent::get_config();

		$this->assertSame( '', $config['links']['cookie_policy_url'] );
	}

	/**
	 * Explicit links.cookie_policy_url values are preserved.
	 */
	public function test_links_cookie_policy_url_can_be_configured() {
		$this->set_cookie_consent_config(
			array(
				'links' => array(
					'cookie_policy_url' => 'https://example.com/cookies/',
				),
			)
		);

		$config = Cookie_Consent::get_config();

		$this->assertSame( 'https://example.com/cookies/', $config['links']['cookie_policy_url'] );
	}

	/**
	 * Whitespace around configured links.cookie_policy_url values is trimmed.
	 */
	public function test_links_cookie_policy_url_is_trimmed() {
		$this->set_cookie_consent_config(
			array(
				'links' => array(
					'cookie_policy_url' => '  https://example.com/cookies/  ',
				),
			)
		);

		$config = Cookie_Consent::get_config();

		$this->assertSame( 'https://example.com/cookies/', $config['links']['cookie_policy_url'] );
	}

	/**
	 * A whitespace-only links.cookie_policy_url is trimmed to an empty string.
	 */
	public function test_whitespace_only_links_cookie_policy_url_is_trimmed_to_empty() {
		$this->set_cookie_consent_config(
			array(
				'links' => array(
					'cookie_policy_url' => "   \t\n",
				),
			)
		);

		$config = Cookie_Consent::get_config();

		$this->assertSame( '', $config['links']['cookie_policy_url'] );
	}
}
