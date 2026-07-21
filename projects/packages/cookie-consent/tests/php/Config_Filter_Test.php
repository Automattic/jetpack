<?php
/**
 * Tests for the `jetpack_cookie_consent_config` override filter.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\CookieConsent\Cookie_Consent
 */
#[CoversClass( Cookie_Consent::class )]
class Config_Filter_Test extends TestCase {

	public function tearDown(): void {
		remove_all_filters( 'jetpack_cookie_consent_config' );
		parent::tearDown();
	}

	/**
	 * A site that does not own the init() call can still layer overrides on top of
	 * the resolved config through the filter.
	 */
	public function test_filter_overrides_resolved_config() {
		add_filter(
			'jetpack_cookie_consent_config',
			static function ( $config ) {
				$config['geo']['provider'] = 'custom';
				$config['geo']['api_url']  = 'https://example.test/geo';
				return $config;
			}
		);

		$config = Cookie_Consent::get_config();

		$this->assertSame( 'custom', $config['geo']['provider'] );
		$this->assertSame( 'https://example.test/geo', $config['geo']['api_url'] );
	}

	/**
	 * The filtered array is re-resolved, so a malformed value a filter injects is
	 * sanitized back to the schema default rather than trusted verbatim.
	 */
	public function test_filtered_value_is_re_validated_by_schema() {
		add_filter(
			'jetpack_cookie_consent_config',
			static function ( $config ) {
				$config['geo']['provider'] = 'bogus';
				return $config;
			}
		);

		$config = Cookie_Consent::get_config();

		$this->assertSame( 'wpcom', $config['geo']['provider'] );
	}

	/**
	 * A filter that returns a non-array (misbehaving) must not fatal or corrupt the
	 * config: resolve_config() falls back to the unfiltered resolved config.
	 */
	public function test_non_array_filter_return_falls_back_to_resolved_config() {
		add_filter( 'jetpack_cookie_consent_config', '__return_null' );

		$config = Cookie_Consent::get_config();

		$this->assertIsArray( $config );
		$this->assertSame( 'wpcom', $config['geo']['provider'] );
		$this->assertTrue( $config['features']['banner'] );
	}
}
