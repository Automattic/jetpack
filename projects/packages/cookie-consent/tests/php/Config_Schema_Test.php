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
}
