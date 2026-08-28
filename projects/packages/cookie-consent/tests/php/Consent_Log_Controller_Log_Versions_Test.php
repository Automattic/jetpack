<?php
/**
 * Tests for Consent_Log_Controller log-version handling.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversMethod;
use ReflectionMethod;

/**
 * @covers \Automattic\Jetpack\CookieConsent\Consent_Log_Controller::get_log_versions
 * @covers \Automattic\Jetpack\CookieConsent\Consent_Log_Controller::truncate_log_version
 */
#[CoversMethod( Consent_Log_Controller::class, 'get_log_versions' )]
#[CoversMethod( Consent_Log_Controller::class, 'truncate_log_version' )]
class Consent_Log_Controller_Log_Versions_Test extends TestCase {

	/**
	 * Invoke a private method on a fresh controller instance.
	 *
	 * @param string $method Method name.
	 * @param mixed  ...$args Arguments.
	 * @return mixed
	 */
	private function invoke( $method, ...$args ) {
		$controller = new Consent_Log_Controller();
		$reflection = new ReflectionMethod( Consent_Log_Controller::class, $method );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}

		return $reflection->invoke( $controller, ...$args );
	}

	/**
	 * Versions within the column length are returned unchanged.
	 */
	public function test_truncate_log_version_keeps_short_values() {
		$this->assertSame( 'policy-2026-06', $this->invoke( 'truncate_log_version', 'policy-2026-06' ) );
	}

	/**
	 * Over-length values are truncated to the varchar(191) column limit.
	 */
	public function test_truncate_log_version_truncates_to_column_limit() {
		$truncated = $this->invoke( 'truncate_log_version', str_repeat( 'a', 300 ) );

		$this->assertSame( 191, strlen( $truncated ) );
	}

	/**
	 * Truncation counts characters, not bytes, so multibyte sequences are not split.
	 */
	public function test_truncate_log_version_does_not_split_multibyte_characters() {
		$truncated = $this->invoke( 'truncate_log_version', str_repeat( 'é', 300 ) );

		// 191 characters kept, and no multibyte sequence was split mid-byte.
		$this->assertSame( 191, mb_strlen( $truncated ) );
		$this->assertSame( $truncated, mb_convert_encoding( $truncated, 'UTF-8', 'UTF-8' ) );
	}

	/**
	 * Normalized defaults are returned when no config is supplied.
	 */
	public function test_get_log_versions_returns_defaults() {
		$this->assertSame(
			array(
				'policy_version' => '1',
				'banner_version' => '1',
			),
			$this->invoke( 'get_log_versions' )
		);
	}

	/**
	 * Configured values are normalized and truncated end to end.
	 */
	public function test_get_log_versions_normalizes_and_truncates() {
		$this->set_cookie_consent_config(
			array(
				'log' => array(
					'policy_version' => ' policy-trimmed ',
					'banner_version' => str_repeat( 'b', 300 ),
				),
			)
		);

		$versions = $this->invoke( 'get_log_versions' );

		$this->assertSame( 'policy-trimmed', $versions['policy_version'] );
		$this->assertSame( 191, strlen( $versions['banner_version'] ) );
	}
}
