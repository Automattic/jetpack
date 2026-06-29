<?php
/**
 * Tests for Cookie_Consent configuration.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversMethod;
use ReflectionMethod;

/**
 * @covers \Automattic\Jetpack\CookieConsent\Cookie_Consent::get_config
 */
#[CoversMethod( Cookie_Consent::class, 'get_config' )]
class Config_Test extends TestCase {

	/**
	 * Tear down: remove config filters.
	 */
	public function tearDown(): void {
		remove_all_filters( 'jetpack_cookie_consent_config' );
		parent::tearDown();
	}

	/**
	 * Get the private Cookie_Consent config for assertions.
	 *
	 * @return array Cookie consent configuration.
	 */
	private function get_config() {
		$method = new ReflectionMethod( Cookie_Consent::class, 'get_config' );
		// setAccessible() is required to invoke a private method on PHP < 8.1, and a
		// deprecated no-op from 8.1 on. Call it only where it's actually needed.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( null );
	}

	/**
	 * The default cookie policy URL is empty.
	 */
	public function test_cookie_policy_url_defaults_to_empty() {
		$config = $this->get_config();

		$this->assertSame( '', $config['links']['cookie_policy_url'] );
		$this->assertSame( '', $config['cookie_policy_url'] );
	}

	/**
	 * Explicit links.cookie_policy_url values are preserved.
	 */
	public function test_links_cookie_policy_url_can_be_configured() {
		add_filter(
			'jetpack_cookie_consent_config',
			function ( $config ) {
				$config['links']['cookie_policy_url'] = 'https://example.com/cookies/';
				return $config;
			}
		);

		$config = $this->get_config();

		$this->assertSame( 'https://example.com/cookies/', $config['links']['cookie_policy_url'] );
		$this->assertSame( 'https://example.com/cookies/', $config['cookie_policy_url'] );
	}

	/**
	 * Legacy top-level cookie_policy_url values map to links.cookie_policy_url.
	 */
	public function test_legacy_cookie_policy_url_maps_to_links_cookie_policy_url() {
		add_filter(
			'jetpack_cookie_consent_config',
			function ( $config ) {
				$config['cookie_policy_url'] = 'https://example.com/legacy-cookies/';
				return $config;
			}
		);

		$config = $this->get_config();

		$this->assertSame( 'https://example.com/legacy-cookies/', $config['links']['cookie_policy_url'] );
		$this->assertSame( 'https://example.com/legacy-cookies/', $config['cookie_policy_url'] );
	}

	/**
	 * Explicit empty links.cookie_policy_url values override legacy top-level values.
	 */
	public function test_empty_links_cookie_policy_url_overrides_legacy_cookie_policy_url() {
		add_filter(
			'jetpack_cookie_consent_config',
			function ( $config ) {
				$config['links']['cookie_policy_url'] = '';
				$config['cookie_policy_url']          = 'https://example.com/legacy-cookies/';
				return $config;
			}
		);

		$config = $this->get_config();

		$this->assertSame( '', $config['links']['cookie_policy_url'] );
		$this->assertSame( '', $config['cookie_policy_url'] );
	}
}
