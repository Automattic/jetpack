<?php
/**
 * Tests for Cookie Consent configuration normalization.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversClass;
use ReflectionClass;

/**
 * Tests for configuration normalization.
 *
 * @covers \Automattic\Jetpack\CookieConsent\Cookie_Consent
 */
#[CoversClass( Cookie_Consent::class )]
class Config_Normalization_Test extends TestCase {

	/**
	 * Call a private static Cookie_Consent method.
	 *
	 * @param string $method Method name.
	 * @param mixed  ...$args Method arguments.
	 * @return mixed Method return value.
	 */
	private function call_cookie_consent_method( $method, ...$args ) {
		$reflection = new ReflectionClass( Cookie_Consent::class );
		$method     = $reflection->getMethod( $method );

		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invokeArgs( null, $args );
	}

	/**
	 * Geo country and region lists are normalized for matching.
	 */
	public function test_normalize_config_normalizes_geo_list_casing() {
		$default_config = $this->call_cookie_consent_method( 'get_default_config' );
		$config         = $this->call_cookie_consent_method(
			'normalize_config',
			array(
				'geo' => array(
					'gdpr_countries' => array( 'ca', 'gB' ),
					'ccpa_regions'   => array( 'California', 'NEW JERSEY' ),
				),
			),
			$default_config
		);

		$this->assertSame( array( 'CA', 'GB' ), $config['geo']['gdpr_countries'] );
		$this->assertSame( array( 'california', 'new jersey' ), $config['geo']['ccpa_regions'] );
	}

	/**
	 * Legacy geo list aliases are normalized when used.
	 */
	public function test_normalize_config_normalizes_legacy_geo_list_casing() {
		$default_config = $this->call_cookie_consent_method( 'get_default_config' );
		$config         = $this->call_cookie_consent_method(
			'normalize_config',
			array(
				'gdpr_countries' => array( 'fr', 'dE' ),
				'ccpa_regions'   => array( 'Texas', 'NEW JERSEY' ),
			),
			$default_config
		);

		$this->assertSame( array( 'FR', 'DE' ), $config['geo']['gdpr_countries'] );
		$this->assertSame( array( 'texas', 'new jersey' ), $config['geo']['ccpa_regions'] );
	}

	/**
	 * An unknown provider falls back to wpcom and restores the default endpoint.
	 */
	public function test_normalize_config_rejects_unknown_provider() {
		$default_config = $this->call_cookie_consent_method( 'get_default_config' );
		$config         = $this->call_cookie_consent_method(
			'normalize_config',
			array(
				'geo' => array(
					'provider' => 'bogus',
					'api_url'  => 'https://example.test/geo',
				),
			),
			$default_config
		);

		$this->assertSame( 'wpcom', $config['geo']['provider'] );
		$this->assertSame( $default_config['geo']['api_url'], $config['geo']['api_url'] );
	}

	/**
	 * A custom provider keeps an explicitly blank api_url so the frontend can flag it.
	 */
	public function test_normalize_config_keeps_blank_custom_api_url() {
		$default_config = $this->call_cookie_consent_method( 'get_default_config' );
		$config         = $this->call_cookie_consent_method(
			'normalize_config',
			array(
				'geo' => array(
					'provider' => 'custom',
					'api_url'  => '',
				),
			),
			$default_config
		);

		$this->assertSame( 'custom', $config['geo']['provider'] );
		$this->assertSame( '', $config['geo']['api_url'] );
	}

	/**
	 * A blank or non-string wpcom api_url is reset to the default endpoint.
	 */
	public function test_normalize_config_resets_blank_wpcom_api_url() {
		$default_config = $this->call_cookie_consent_method( 'get_default_config' );

		foreach ( array( '', 123, null ) as $bad_url ) {
			$config = $this->call_cookie_consent_method(
				'normalize_config',
				array(
					'geo' => array(
						'provider' => 'wpcom',
						'api_url'  => $bad_url,
					),
				),
				$default_config
			);

			$this->assertSame( $default_config['geo']['api_url'], $config['geo']['api_url'] );
		}
	}

	/**
	 * A nested geo override wins over a legacy alias; a legacy-only key still folds in.
	 */
	public function test_normalize_config_nested_geo_wins_over_legacy() {
		$default_config = $this->call_cookie_consent_method( 'get_default_config' );
		$config         = $this->call_cookie_consent_method(
			'normalize_config',
			array(
				'geo'                 => array(
					'provider' => 'custom',
					'api_url'  => 'https://nested.example.test/geo',
				),
				'geo_api_url'         => 'https://legacy.example.test/geo',
				'country_code_cookie' => 'legacy_cc',
			),
			$default_config
		);

		$this->assertSame( 'https://nested.example.test/geo', $config['geo']['api_url'] );
		$this->assertSame( 'legacy_cc', $config['geo']['country_code_cookie'] );
	}

	/**
	 * A nested override is kept even when the legacy mirror still holds the default value.
	 */
	public function test_normalize_config_keeps_nested_override_with_default_legacy() {
		$default_config = $this->call_cookie_consent_method( 'get_default_config' );
		$config         = $this->call_cookie_consent_method(
			'normalize_config',
			array(
				'geo'           => array( 'region_cookie' => 'shopper_region' ),
				'region_cookie' => $default_config['region_cookie'],
			),
			$default_config
		);

		$this->assertSame( 'shopper_region', $config['geo']['region_cookie'] );
	}

	/**
	 * Scalar geo values are coerced; a non-numeric duration falls back to the default.
	 */
	public function test_normalize_config_coerces_geo_scalars() {
		$default_config = $this->call_cookie_consent_method( 'get_default_config' );

		$config = $this->call_cookie_consent_method(
			'normalize_config',
			array(
				'geo' => array(
					'cookie_duration' => '7200',
					'show_on_error'   => 0,
				),
			),
			$default_config
		);
		$this->assertSame( 7200, $config['geo']['cookie_duration'] );
		$this->assertFalse( $config['geo']['show_on_error'] );

		$fallback = $this->call_cookie_consent_method(
			'normalize_config',
			array( 'geo' => array( 'cookie_duration' => 'nope' ) ),
			$default_config
		);
		$this->assertSame( $default_config['geo']['cookie_duration'], $fallback['geo']['cookie_duration'] );
	}

	/**
	 * A non-array filter result falls back to the default geo configuration.
	 */
	public function test_normalize_config_handles_non_array_input() {
		$default_config = $this->call_cookie_consent_method( 'get_default_config' );

		foreach ( array( null, '', 'x', 5 ) as $bad_config ) {
			$config = $this->call_cookie_consent_method( 'normalize_config', $bad_config, $default_config );
			$this->assertSame( $default_config['geo'], $config['geo'] );
		}
	}
}
