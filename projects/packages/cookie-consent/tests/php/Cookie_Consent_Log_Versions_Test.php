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
	 * _doing_it_wrong() function names captured during a test.
	 *
	 * @var string[]
	 */
	private $doing_it_wrong = array();

	/**
	 * Tear down: clear cookie-consent config filters and doing-it-wrong capture.
	 */
	public function tearDown(): void {
		remove_all_filters( 'jetpack_cookie_consent_config' );
		remove_all_filters( 'doing_it_wrong_trigger_error' );
		remove_all_actions( 'doing_it_wrong_run' );
		parent::tearDown();
	}

	/**
	 * Capture _doing_it_wrong() calls without tripping the suite's failOnWarning gate.
	 *
	 * Records each triggering function name in $this->doing_it_wrong and suppresses the
	 * underlying PHP warning, so a test can assert the diagnostic fired.
	 */
	private function capture_doing_it_wrong() {
		$this->doing_it_wrong = array();
		add_filter( 'doing_it_wrong_trigger_error', '__return_false' );
		add_action(
			'doing_it_wrong_run',
			function ( $function_name ) {
				$this->doing_it_wrong[] = $function_name;
			}
		);
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
	 * Invalid log version values fall back to the default version and surface a diagnostic.
	 */
	public function test_get_log_versions_defaults_invalid_values() {
		$this->capture_doing_it_wrong();
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

		// Both dropped values are surfaced rather than silently defaulted.
		$this->assertCount( 2, $this->doing_it_wrong );
	}

	/**
	 * Empty log version values fall back to the default version and surface a diagnostic.
	 */
	public function test_get_log_versions_defaults_empty_values() {
		$this->capture_doing_it_wrong();
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

		// Both dropped values are surfaced rather than silently defaulted.
		$this->assertCount( 2, $this->doing_it_wrong );
	}
}
