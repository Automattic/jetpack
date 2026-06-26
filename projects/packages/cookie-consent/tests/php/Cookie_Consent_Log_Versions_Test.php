<?php
/**
 * Tests for Cookie_Consent::get_log_versions().
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversMethod;

/**
 * @covers \Automattic\Jetpack\CookieConsent\Cookie_Consent::get_log_versions
 */
#[CoversMethod( Cookie_Consent::class, 'get_log_versions' )]
class Cookie_Consent_Log_Versions_Test extends TestCase {

	/**
	 * Tear down: clear cookie-consent config filters.
	 */
	public function tearDown(): void {
		remove_all_filters( 'jetpack_cookie_consent_config' );
		parent::tearDown();
	}

	/**
	 * Default log versions are returned when no config override is supplied.
	 */
	public function test_get_log_versions_returns_defaults() {
		$this->assertSame(
			array(
				'policy_version' => '1',
				'banner_version' => '1',
			),
			Cookie_Consent::get_log_versions()
		);
	}

	/**
	 * Configured log versions are returned from the cookie consent config filter.
	 */
	public function test_get_log_versions_returns_filtered_overrides() {
		add_filter(
			'jetpack_cookie_consent_config',
			static function ( $config ) {
				$config['log']['policy_version'] = 'policy-2026-06';
				$config['log']['banner_version'] = 'banner-2026-06';

				return $config;
			}
		);

		$this->assertSame(
			array(
				'policy_version' => 'policy-2026-06',
				'banner_version' => 'banner-2026-06',
			),
			Cookie_Consent::get_log_versions()
		);
	}

	/**
	 * Scalar log versions are normalized to non-empty strings.
	 */
	public function test_get_log_versions_normalizes_scalar_values() {
		add_filter(
			'jetpack_cookie_consent_config',
			static function ( $config ) {
				$config['log']['policy_version'] = 202606;
				$config['log']['banner_version'] = ' banner-v2 ';

				return $config;
			}
		);

		$this->assertSame(
			array(
				'policy_version' => '202606',
				'banner_version' => 'banner-v2',
			),
			Cookie_Consent::get_log_versions()
		);
	}

	/**
	 * Invalid log version values fall back to the default version.
	 */
	public function test_get_log_versions_defaults_invalid_values() {
		add_filter(
			'jetpack_cookie_consent_config',
			static function ( $config ) {
				$config['log']['policy_version'] = array( 'policy-2026-06' );
				$config['log']['banner_version'] = new \stdClass();

				return $config;
			}
		);

		$this->assertSame(
			array(
				'policy_version' => '1',
				'banner_version' => '1',
			),
			Cookie_Consent::get_log_versions()
		);
	}

	/**
	 * Empty log version values fall back to the default version.
	 */
	public function test_get_log_versions_defaults_empty_values() {
		add_filter(
			'jetpack_cookie_consent_config',
			static function ( $config ) {
				$config['log']['policy_version'] = '';
				$config['log']['banner_version'] = " \t ";

				return $config;
			}
		);

		$this->assertSame(
			array(
				'policy_version' => '1',
				'banner_version' => '1',
			),
			Cookie_Consent::get_log_versions()
		);
	}
}
