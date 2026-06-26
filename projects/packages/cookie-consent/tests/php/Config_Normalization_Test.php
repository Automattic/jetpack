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
	 * @param array  ...$args Method arguments.
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
		$this->assertSame( array( 'CA', 'GB' ), $config['gdpr_countries'] );
		$this->assertSame( array( 'california', 'new jersey' ), $config['ccpa_regions'] );
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
		$this->assertSame( array( 'FR', 'DE' ), $config['gdpr_countries'] );
		$this->assertSame( array( 'texas', 'new jersey' ), $config['ccpa_regions'] );
	}
}
