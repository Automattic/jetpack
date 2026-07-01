<?php
/**
 * Tests for the declarative Config_Schema.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass( Config_Schema::class )]
class Config_Schema_Test extends TestCase {

	public function test_schema_is_object_with_feature_toggles() {
		$schema = Config_Schema::schema();

		$this->assertSame( 'object', $schema['type'] );
		$features = $schema['properties']['features']['properties'];

		foreach ( array( 'banner', 'ccpa_page', 'footer_links', 'consent_log', 'tracks', 'geo' ) as $feature ) {
			$this->assertTrue( $features[ $feature ]['default'], "$feature should default on" );
		}
		$this->assertFalse( $features['page_deletion_lock']['default'], 'page_deletion_lock should default off' );
	}

	public function test_schema_declares_enums_and_master_switch() {
		$schema = Config_Schema::schema();

		$this->assertTrue( $schema['properties']['enabled']['default'] );
		$this->assertSame( array( 'wpcom', 'custom' ), $schema['properties']['geo']['properties']['provider']['enum'] );
		$this->assertSame( array( 'drop', 'hash', 'truncate', 'raw' ), $schema['properties']['log']['properties']['ip_mode']['enum'] );
		$this->assertSame( 'drop', $schema['properties']['log']['properties']['ip_mode']['default'] );
	}

	public function test_resolve_fills_defaults() {
		$config = Config_Schema::resolve();

		$this->assertSame( 'wpcom', $config['geo']['provider'] );
		$this->assertSame( 'https://public-api.wordpress.com/geo/', $config['geo']['api_url'] );
		$this->assertTrue( $config['features']['banner'] );
		$this->assertFalse( $config['features']['page_deletion_lock'] );
		$this->assertSame( 'drop', $config['log']['ip_mode'] );
	}

	public function test_resolve_normalizes_geo_list_casing() {
		$config = Config_Schema::resolve(
			array( 'geo' => array( 'gdpr_countries' => array( 'ca', 'gB' ), 'ccpa_regions' => array( 'California', 'NEW JERSEY' ) ) )
		);

		$this->assertSame( array( 'CA', 'GB' ), $config['geo']['gdpr_countries'] );
		$this->assertSame( array( 'california', 'new jersey' ), $config['geo']['ccpa_regions'] );
	}

	public function test_resolve_rejects_unknown_provider() {
		$config = Config_Schema::resolve(
			array( 'geo' => array( 'provider' => 'bogus', 'api_url' => 'https://example.test/geo' ) )
		);

		$this->assertSame( 'wpcom', $config['geo']['provider'] );
		$this->assertSame( 'https://public-api.wordpress.com/geo/', $config['geo']['api_url'] );
	}

	public function test_resolve_keeps_blank_custom_api_url() {
		$config = Config_Schema::resolve( array( 'geo' => array( 'provider' => 'custom', 'api_url' => '' ) ) );

		$this->assertSame( 'custom', $config['geo']['provider'] );
		$this->assertSame( '', $config['geo']['api_url'] );
	}

	public function test_resolve_coerces_geo_scalars_with_fallback() {
		$config = Config_Schema::resolve( array( 'geo' => array( 'cookie_duration' => '7200', 'show_on_error' => 0 ) ) );
		$this->assertSame( 7200, $config['geo']['cookie_duration'] );
		$this->assertFalse( $config['geo']['show_on_error'] );

		$fallback = Config_Schema::resolve( array( 'geo' => array( 'cookie_duration' => 'nope' ) ) );
		$this->assertSame( 6 * HOUR_IN_SECONDS, $fallback['geo']['cookie_duration'] );
	}

	public function test_resolve_applies_feature_overrides() {
		$config = Config_Schema::resolve( array( 'features' => array( 'ccpa_page' => false, 'tracks' => false ) ) );

		$this->assertFalse( $config['features']['ccpa_page'] );
		$this->assertFalse( $config['features']['tracks'] );
		$this->assertTrue( $config['features']['banner'] );
	}
}
