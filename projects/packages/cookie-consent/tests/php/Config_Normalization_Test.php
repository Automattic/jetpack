<?php
/**
 * Tests for Cookie Consent configuration normalization.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * Tests for configuration normalization.
 *
 * @covers \Automattic\Jetpack\CookieConsent\Config_Schema
 */
#[CoversClass( Config_Schema::class )]
class Config_Normalization_Test extends TestCase {

	/**
	 * _doing_it_wrong() function names captured during a test.
	 *
	 * @var string[]
	 */
	private $doing_it_wrong = array();

	/**
	 * Tear down: clear doing-it-wrong capture.
	 */
	public function tearDown(): void {
		remove_all_filters( 'doing_it_wrong_trigger_error' );
		remove_all_actions( 'doing_it_wrong_run' );
		parent::tearDown();
	}

	/**
	 * Capture _doing_it_wrong() calls without tripping the suite's failOnWarning gate.
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
	 * Geo country and region lists are normalized for matching.
	 */
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

	/**
	 * An unknown provider falls back to wpcom and restores the default endpoint.
	 */
	public function test_resolve_rejects_unknown_provider() {
		$default_config = Config_Schema::resolve();
		$config         = Config_Schema::resolve(
			array(
				'geo' => array(
					'provider' => 'bogus',
					'api_url'  => 'https://example.test/geo',
				),
			)
		);

		$this->assertSame( 'wpcom', $config['geo']['provider'] );
		$this->assertSame( $default_config['geo']['api_url'], $config['geo']['api_url'] );
	}

	/**
	 * A custom provider keeps an explicitly blank api_url so the frontend can flag it.
	 */
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

	/**
	 * A blank or non-string wpcom api_url is reset to the default endpoint.
	 */
	public function test_resolve_resets_blank_wpcom_api_url() {
		$default_config = Config_Schema::resolve();

		foreach ( array( '', 123, null ) as $bad_url ) {
			$config = Config_Schema::resolve(
				array(
					'geo' => array(
						'provider' => 'wpcom',
						'api_url'  => $bad_url,
					),
				)
			);

			$this->assertSame( $default_config['geo']['api_url'], $config['geo']['api_url'] );
		}
	}

	/**
	 * Scalar geo values are coerced; a non-numeric duration falls back to the default.
	 */
	public function test_resolve_coerces_geo_scalars() {
		$default_config = Config_Schema::resolve();

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
		$this->assertSame( $default_config['geo']['cookie_duration'], $fallback['geo']['cookie_duration'] );
	}

	/**
	 * A non-array config falls back to the default geo configuration.
	 */
	public function test_resolve_handles_non_array_input() {
		$default_config = Config_Schema::resolve();

		foreach ( array( null, '', 'x', 5 ) as $bad_config ) {
			$config = Config_Schema::resolve( $bad_config );
			$this->assertSame( $default_config['geo'], $config['geo'] );
		}
	}

	/**
	 * The Tracks feature flag defaults on and can be disabled by configuration.
	 */
	public function test_resolve_preserves_tracks_feature_flag() {
		$config = Config_Schema::resolve();
		$this->assertTrue( $config['features']['tracks'] );

		$config = Config_Schema::resolve( array( 'features' => array( 'tracks' => false ) ) );
		$this->assertFalse( $config['features']['tracks'] );
	}

	/**
	 * The frontend loader owns consent-aware Tracks loading, so PHP must not
	 * enqueue w.js before the visitor's region and consent state are known.
	 */
	public function test_enqueue_assets_does_not_enqueue_tracks_script() {
		global $wp_scripts, $wp_styles;

		$wp_scripts = null;
		$wp_styles  = null;

		ob_start();
		Cookie_Consent::enqueue_assets();
		ob_end_clean();

		$this->assertFalse( wp_script_is( 'jetpack-cookie-consent-tracks', 'registered' ) );
		$this->assertFalse( wp_script_is( 'jetpack-cookie-consent-tracks', 'enqueued' ) );
	}

	/**
	 * Categories keyed with a reserved frontend alias are dropped so they can't
	 * overwrite a built-in category, and the rejection is surfaced.
	 */
	public function test_get_consent_categories_rejects_reserved_alias_keys() {
		$this->capture_doing_it_wrong();

		$categories = Cookie_Consent::get_consent_categories(
			array(
				'consent' => array(
					'categories' => array(
						array( 'key' => 'functional' ),
						array( 'key' => 'required' ),
						array( 'key' => 'advertising' ),
						array( 'key' => 'personalization' ),
					),
				),
			)
		);

		$this->assertSame( array( 'functional', 'personalization' ), array_column( $categories, 'key' ) );
		$this->assertNotEmpty( $this->doing_it_wrong );
	}

	/**
	 * Malformed category entries are dropped, keys are sanitized, and the
	 * WP Consent API map falls back to the category key when omitted.
	 */
	public function test_get_consent_categories_normalizes_malformed_input() {
		$categories = Cookie_Consent::get_consent_categories(
			array(
				'consent' => array(
					'categories' => array(
						array( 'label' => 'no key' ),
						array( 'key' => 'My-Cat!' ),
						array(
							'key'            => 'my_cat',
							'wp_consent_map' => array( 'x' ),
						),
						array(
							'key'            => 'ads',
							'wp_consent_map' => array( 'Marketing!', 'marketing_', 'marketing_' ),
						),
					),
				),
			)
		);

		$this->assertSame( array( 'my_cat', 'ads' ), array_column( $categories, 'key' ) );
		$this->assertSame( array( 'my_cat' ), $categories[0]['wp_consent_map'] );
		$this->assertSame( array( 'marketing', 'marketing_' ), $categories[1]['wp_consent_map'] );
	}

	/**
	 * Non-array categories fall back to the default registry.
	 */
	public function test_get_consent_categories_returns_defaults_for_non_array() {
		$defaults = Cookie_Consent::get_consent_categories();

		$this->assertSame(
			$defaults,
			Cookie_Consent::get_consent_categories(
				array( 'consent' => array( 'categories' => 'nope' ) )
			)
		);
	}

	/**
	 * The frontend registry renames keys to camelCase and maps default aliases.
	 */
	public function test_get_frontend_consent_categories_maps_aliases_and_shape() {
		$frontend = Cookie_Consent::get_frontend_consent_categories(
			Cookie_Consent::get_consent_categories()
		);

		$this->assertSame(
			array(
				'key'            => 'functional',
				'preferenceKey'  => 'required',
				'required'       => true,
				'defaultChecked' => true,
				'wpConsentMap'   => array( 'functional' ),
			),
			$frontend[0]
		);
		$this->assertSame( array( 'statistics', 'statistics-anonymous' ), $frontend[1]['wpConsentMap'] );
		$this->assertSame( 'advertising', $frontend[2]['preferenceKey'] );
	}
}
