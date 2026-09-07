<?php
/**
 * Tests for the declarative Config_Schema.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\CookieConsent\Config_Schema
 */
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

	/**
	 * The public ip_mode accessors return the same values the schema declares, so a
	 * consumer (Consent_Log_Controller) reading them can't drift from the descriptor.
	 */
	public function test_ip_mode_accessors_match_schema() {
		$schema = Config_Schema::schema();

		$this->assertSame( $schema['properties']['log']['properties']['ip_mode']['enum'], Config_Schema::ip_modes() );
		$this->assertSame( $schema['properties']['log']['properties']['ip_mode']['default'], Config_Schema::default_ip_mode() );
	}

	public function test_resolve_fills_defaults() {
		$config = Config_Schema::resolve();

		$this->assertSame( 'wpcom', $config['geo']['provider'] );
		$this->assertSame( 'https://public-api.wordpress.com/geo/', $config['geo']['api_url'] );
		$this->assertTrue( $config['features']['banner'] );
		$this->assertFalse( $config['features']['page_deletion_lock'] );
		$this->assertSame( 'drop', $config['log']['ip_mode'] );
		$this->assertSame( 1, $config['schema_version'] );
	}

	public function test_resolve_honors_schema_version_override() {
		$config = Config_Schema::resolve( array( 'schema_version' => 2 ) );

		$this->assertSame( 2, $config['schema_version'] );
	}

	public function test_resolve_rejects_invalid_schema_version() {
		$config = Config_Schema::resolve( array( 'schema_version' => 'not-a-number' ) );

		$this->assertSame( 1, $config['schema_version'] );
	}

	public function test_resolve_normalizes_geo_list_casing() {
		$config = Config_Schema::resolve(
			array(
				'geo' => array(
					'gdpr_countries' => array( 'ca', 'gB' ),
					'ccpa_regions'   => array( 'California', 'NEW JERSEY' ),
				),
			)
		);

		$this->assertSame( array( 'CA', 'GB' ), $config['geo']['gdpr_countries'] );
		$this->assertSame( array( 'california', 'new jersey' ), $config['geo']['ccpa_regions'] );
	}

	public function test_resolve_drops_non_scalar_geo_list_entries() {
		$config = Config_Schema::resolve(
			array(
				'geo' => array(
					'gdpr_countries' => array( 'ca', array( 'nested' ) ),
					'ccpa_regions'   => array( 'california', array( 'x' ) ),
				),
			)
		);

		$this->assertSame( array( 'CA' ), $config['geo']['gdpr_countries'] );
		$this->assertSame( array( 'california' ), $config['geo']['ccpa_regions'] );
	}

	public function test_resolve_ignores_non_array_consent() {
		$defaults = Config_Schema::resolve()['consent']['categories'];

		// A plain scalar: relies on `??`'s offset-access suppression already masking the
		// hazard on PHP 8, but must still resolve to the defaults rather than 'x' itself.
		$config = Config_Schema::resolve( array( 'consent' => 'x' ) );
		$this->assertSame( $defaults, $config['consent']['categories'] );

		// An object: `??` does not suppress "Cannot use object of type X as array", so an
		// unguarded `$config['consent']['categories']` genuinely fatals here on PHP 8.
		$config = Config_Schema::resolve( array( 'consent' => new \stdClass() ) );
		$this->assertSame( $defaults, $config['consent']['categories'] );
	}

	public function test_resolve_rejects_unknown_provider() {
		$config = Config_Schema::resolve(
			array(
				'geo' => array(
					'provider' => 'bogus',
					'api_url'  => 'https://example.test/geo',
				),
			)
		);

		$this->assertSame( 'wpcom', $config['geo']['provider'] );
		$this->assertSame( 'https://public-api.wordpress.com/geo/', $config['geo']['api_url'] );
	}

	public function test_resolve_keeps_blank_custom_api_url() {
		$config = Config_Schema::resolve(
			array(
				'geo' => array(
					'provider' => 'custom',
					'api_url'  => '',
				),
			)
		);

		$this->assertSame( 'custom', $config['geo']['provider'] );
		$this->assertSame( '', $config['geo']['api_url'] );
	}

	public function test_resolve_coerces_geo_scalars_with_fallback() {
		$config = Config_Schema::resolve(
			array(
				'geo' => array(
					'cookie_duration' => '7200',
					'show_on_error'   => 0,
				),
			)
		);
		$this->assertSame( 7200, $config['geo']['cookie_duration'] );
		$this->assertFalse( $config['geo']['show_on_error'] );

		$fallback = Config_Schema::resolve( array( 'geo' => array( 'cookie_duration' => 'nope' ) ) );
		$this->assertSame( 6 * HOUR_IN_SECONDS, $fallback['geo']['cookie_duration'] );
	}

	public function test_resolve_applies_feature_overrides() {
		$config = Config_Schema::resolve(
			array(
				'features' => array(
					'ccpa_page' => false,
					'tracks'    => false,
				),
			)
		);

		$this->assertFalse( $config['features']['ccpa_page'] );
		$this->assertFalse( $config['features']['tracks'] );
		$this->assertTrue( $config['features']['banner'] );
	}

	/**
	 * `log.ip_mode` carries a strict enum, so an unknown value resolves to the schema
	 * default rather than passing through verbatim. This keeps the filter re-resolve a
	 * real safety net for the field, not a no-op.
	 */
	public function test_resolve_validates_log_ip_mode_enum() {
		$this->assertSame( 'hash', Config_Schema::resolve( array( 'log' => array( 'ip_mode' => 'hash' ) ) )['log']['ip_mode'] );
		$this->assertSame( 'drop', Config_Schema::resolve( array( 'log' => array( 'ip_mode' => 'bogus' ) ) )['log']['ip_mode'] );
	}

	/**
	 * `log.retention_days` is coerced to an integer; a non-numeric value falls back to the
	 * schema default instead of being emitted as a raw string.
	 */
	public function test_resolve_coerces_log_retention_days() {
		$this->assertSame( 45, Config_Schema::resolve( array( 'log' => array( 'retention_days' => '45' ) ) )['log']['retention_days'] );
		$this->assertSame( 30, Config_Schema::resolve( array( 'log' => array( 'retention_days' => 'nope' ) ) )['log']['retention_days'] );
	}

	/**
	 * `log.policy_version`/`banner_version` stay deliberately permissive — resolve() passes
	 * them through unchanged for Cookie_Consent::get_log_versions() to coerce downstream.
	 */
	public function test_resolve_keeps_log_versions_permissive() {
		$config = Config_Schema::resolve( array( 'log' => array( 'policy_version' => 'policy-2026-06' ) ) );

		$this->assertSame( 'policy-2026-06', $config['log']['policy_version'] );
	}

	/**
	 * A single resolve() derives `consent.categories` from the resolved `copy`, not the
	 * pristine default, when the caller doesn't supply its own categories. This guards the
	 * single-pass contract only; it does not exercise a re-resolve of an already-resolved
	 * config (which is no longer done now that get_config() resolves once and stashes).
	 */
	public function test_resolve_derives_categories_from_overridden_copy() {
		$config = Config_Schema::resolve(
			array(
				'copy' => array(
					'required_category_label' => 'CUSTOM REQUIRED LABEL',
				),
			)
		);

		$functional = null;
		foreach ( $config['consent']['categories'] as $category ) {
			if ( 'functional' === $category['key'] ) {
				$functional = $category;
				break;
			}
		}

		$this->assertNotNull( $functional, 'The default functional/required category must still be present.' );
		$this->assertSame( 'CUSTOM REQUIRED LABEL', $functional['label'] );
	}

	/**
	 * Idempotency isn't relied on for the derivation above, but resolve() must still be
	 * stable: resolving an already-resolved config a second time returns the same result.
	 */
	public function test_resolve_is_stable_when_applied_twice() {
		$once  = Config_Schema::resolve(
			array(
				'copy' => array(
					'required_category_label' => 'CUSTOM REQUIRED LABEL',
				),
			)
		);
		$twice = Config_Schema::resolve( $once );

		$this->assertSame( $once, $twice );
	}
}
