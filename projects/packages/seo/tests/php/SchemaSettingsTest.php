<?php
/**
 * Tests for the Jetpack SEO Schema_Settings store.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Schema_Settings
 */
#[CoversClass( Schema_Settings::class )]
class SchemaSettingsTest extends TestCase {

	/**
	 * Give the site a stable identity (Site Title, Tagline) for the test, mirroring
	 * OrganizationSchemaNodeTest.
	 *
	 * @param string $name        Site Title.
	 * @param string $description Tagline.
	 * @return void
	 */
	private function set_site_identity( $name, $description = '' ) {
		add_filter(
			'pre_option_blogname',
			static function () use ( $name ) {
				return $name;
			}
		);
		add_filter(
			'pre_option_blogdescription',
			static function () use ( $description ) {
				return $description;
			}
		);
	}

	/**
	 * Remove WooCommerce store options used by LocalBusiness defaults.
	 *
	 * @return void
	 */
	private function delete_woo_options() {
		foreach (
			array(
				'woocommerce_store_address',
				'woocommerce_store_address_2',
				'woocommerce_store_city',
				'woocommerce_store_postcode',
				'woocommerce_default_country',
			) as $option
		) {
			delete_option( $option );
		}
	}

	/**
	 * Start each test from a clean option.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();
		delete_option( Schema_Settings::OPTION_NAME );
		$this->delete_woo_options();
	}

	/**
	 * Remove the site-identity filters and stored option so state doesn't leak.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		remove_all_filters( 'pre_option_blogname' );
		remove_all_filters( 'pre_option_blogdescription' );
		delete_option( Schema_Settings::OPTION_NAME );
		$this->delete_woo_options();
		parent::tearDown();
	}

	/**
	 * Defaults seed Organization `name` / `description` from site identity.
	 */
	public function test_defaults_seed_from_site_identity() {
		$this->set_site_identity( 'Acme Co', 'We make things' );

		$defaults = Schema_Settings::get_defaults();

		$this->assertSame( 'Acme Co', $defaults['organization']['name'] );
		$this->assertSame( 'We make things', $defaults['organization']['description'] );
		$this->assertSame(
			array(
				'streetAddress'   => '',
				'addressLocality' => '',
				'addressRegion'   => '',
				'postalCode'      => '',
				'addressCountry'  => '',
			),
			$defaults['localBusiness']['address']
		);
	}

	/**
	 * With nothing stored, the effective settings are the site-identity defaults.
	 */
	public function test_effective_settings_fall_back_to_defaults_when_unstored() {
		$this->set_site_identity( 'Acme Co', 'We make things' );

		$effective = Schema_Settings::get_organization();

		$this->assertSame( 'Acme Co', $effective['name'] );
		$this->assertSame( 'We make things', $effective['description'] );
		$this->assertSame( array(), $effective['sameAs'] );
		$this->assertSame( '', $effective['email'] );
	}

	/**
	 * The editable payload includes the stored LocalBusiness section and defaults.
	 */
	public function test_editable_payload_includes_local_business_shape() {
		$editable = Schema_Settings::get_editable();

		$this->assertFalse( $editable['localBusiness']['enabled'] );
		$this->assertSame( '', $editable['localBusiness']['address']['streetAddress'] );
		$this->assertSame( '', $editable['localBusiness']['telephone'] );
		$this->assertSame(
			array(
				'latitude'  => '',
				'longitude' => '',
			),
			$editable['localBusiness']['geo']
		);
		$this->assertSame(
			array(
				'opens'  => '',
				'closes' => '',
			),
			$editable['localBusiness']['openingHours']['Mo']
		);
		$this->assertSame( '', $editable['localBusiness']['priceRange'] );
		$this->assertArrayHasKey( 'localBusiness', $editable['defaults'] );
	}

	/**
	 * Sanitization trims/strips text, keeps only valid absolute http(s) `sameAs`
	 * URLs (dropping empty/relative/scheme-less/single-word
	 * junk/`mailto:`/`javascript:` and duplicates — mirroring Organization_Schema_Node
	 * so what's stored is exactly what's emitted), and
	 * sanitizes `email`.
	 */
	public function test_sanitize_normalizes_each_field() {
		$clean = Schema_Settings::sanitize(
			array(
				'organization' => array(
					'name'        => "  Acme <b>Co</b>\n",
					'description' => '  We make things  ',
					'sameAs'      => array(
						'https://twitter.com/acme',
						'https://bsky.app/profile/acme.example',
						'',
						'/relative-profile',
						'bsky.app/profile/acme.example',
						'not a url',
						'sasada',
						'javascript:alert(1)',
						'mailto:hello@acme.test',
						'https://twitter.com/acme',
						'https://facebook.com/acme',
						'https://unresolvable-host.example/acme',
					),
					'email'       => '  hello@acme.test ',
				),
			)
		);

		$this->assertSame( 'Acme Co', $clean['organization']['name'] );
		$this->assertSame( 'We make things', $clean['organization']['description'] );
		$this->assertSame(
			array(
				'https://twitter.com/acme',
				'https://bsky.app/profile/acme.example',
				'https://facebook.com/acme',
				'https://unresolvable-host.example/acme',
			),
			$clean['organization']['sameAs']
		);
		$this->assertSame( 'hello@acme.test', $clean['organization']['email'] );
	}

	/**
	 * Non-array input (and a non-array `organization`) sanitize to the empty option
	 * shape rather than producing a malformed structure.
	 */
	public function test_sanitize_is_defensive_against_bad_input() {
		$from_scalar = Schema_Settings::sanitize( 'nonsense' );
		$this->assertSame(
			array(
				'name'        => '',
				'description' => '',
				'sameAs'      => array(),
				'email'       => '',
			),
			$from_scalar['organization']
		);

		// A `sameAs` that isn't a list is ignored rather than emitted.
		$bad_same_as = Schema_Settings::sanitize(
			array( 'organization' => array( 'sameAs' => 'https://twitter.com/acme' ) )
		);
		$this->assertSame( array(), $bad_same_as['organization']['sameAs'] );

		$bad_local_business = Schema_Settings::sanitize(
			array(
				'localBusiness' => array(
					'address'      => 'not-address',
					'geo'          => 'not-geo',
					'openingHours' => 'not-hours',
				),
			)
		);
		$this->assertSame( '', $bad_local_business['localBusiness']['address']['streetAddress'] );
		$this->assertSame(
			array(
				'latitude'  => '',
				'longitude' => '',
			),
			$bad_local_business['localBusiness']['geo']
		);
		$this->assertSame(
			array(
				'opens'  => '',
				'closes' => '',
			),
			$bad_local_business['localBusiness']['openingHours']['Su']
		);
	}

	/**
	 * LocalBusiness sanitization normalizes text, coordinates, and hours.
	 */
	public function test_sanitize_normalizes_local_business() {
		$clean = Schema_Settings::sanitize(
			array(
				'localBusiness' => array(
					'enabled'      => '1',
					'address'      => array(
						'streetAddress'   => '  123 <b>Main</b> St  ',
						'addressLocality' => '  New York  ',
						'addressRegion'   => '  NY  ',
						'postalCode'      => '  10001  ',
						'addressCountry'  => '  us  ',
					),
					'telephone'    => '  +1 555 123 4567  ',
					'geo'          => array(
						'latitude'  => '91',
						'longitude' => '-74.0060',
					),
					'openingHours' => array(
						'Mo' => array(
							'opens'  => ' 09:00 ',
							'closes' => '17:00',
						),
						'Tu' => array(
							'opens'  => '9:00',
							'closes' => '17:00',
						),
						'We' => array(
							'opens'  => '09:00',
							'closes' => '',
						),
						'Th' => array(
							'opens'  => '20:45',
							'closes' => '06:15',
						),
						'XX' => array(
							'opens'  => '09:00',
							'closes' => '17:00',
						),
					),
					'priceRange'   => '  $$  ',
				),
			)
		);

		$local_business = $clean['localBusiness'];
		$this->assertTrue( $local_business['enabled'] );
		$this->assertSame( '123 Main St', $local_business['address']['streetAddress'] );
		$this->assertSame( 'New York', $local_business['address']['addressLocality'] );
		$this->assertSame( 'US', $local_business['address']['addressCountry'] );
		$this->assertSame( '+1 555 123 4567', $local_business['telephone'] );
		$this->assertSame( '$$', $local_business['priceRange'] );
		$this->assertSame(
			array(
				'latitude'  => '',
				'longitude' => '',
			),
			$local_business['geo']
		);
		$this->assertSame(
			array(
				'opens'  => '09:00',
				'closes' => '17:00',
			),
			$local_business['openingHours']['Mo']
		);
		$this->assertSame(
			array(
				'opens'  => '',
				'closes' => '',
			),
			$local_business['openingHours']['Tu']
		);
		$this->assertSame(
			array(
				'opens'  => '',
				'closes' => '',
			),
			$local_business['openingHours']['We']
		);
		$this->assertSame(
			array(
				'opens'  => '20:45',
				'closes' => '06:15',
			),
			$local_business['openingHours']['Th']
		);
		$this->assertArrayNotHasKey( 'XX', $local_business['openingHours'] );
		$this->assertSame( array( 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su' ), array_keys( $local_business['openingHours'] ) );
	}

	/**
	 * Country codes are optional, limited to two ASCII letters, and uppercased.
	 */
	public function test_sanitize_validates_country_code() {
		foreach (
			array(
				''              => '',
				' us '          => 'US',
				'zz'            => 'ZZ',
				'USA'           => '',
				'U1'            => '',
				'Mé'            => '',
				'United States' => '',
			) as $input => $expected
		) {
			$clean = Schema_Settings::sanitize(
				array(
					'localBusiness' => array(
						'address' => array( 'addressCountry' => $input ),
					),
				)
			);

			$this->assertSame( $expected, $clean['localBusiness']['address']['addressCountry'], $input );
		}
	}

	/**
	 * Telephone numbers require a digit and use the permissive Forms-compatible
	 * character set, with `+` allowed only as the first character.
	 */
	public function test_sanitize_validates_telephone() {
		foreach (
			array(
				''                   => '',
				' +36 (1) 234-5678 ' => '+36 (1) 234-5678',
				' 1 '                => '1',
				'(555) 123-4567'     => '(555) 123-4567',
				'+'                  => '',
				'()- '               => '',
				'555.123.4567'       => '',
				'+1 ext 2'           => '',
				'12+34'              => '',
				"555\t123"           => '',
			) as $input => $expected
		) {
			$clean = Schema_Settings::sanitize(
				array(
					'localBusiness' => array( 'telephone' => $input ),
				)
			);

			$this->assertSame( $expected, $clean['localBusiness']['telephone'], $input );
		}
	}

	/**
	 * Price ranges accept free text shorter than 100 Unicode code points.
	 */
	public function test_sanitize_validates_price_range_length() {
		$ascii_99    = str_repeat( '$', 99 );
		$ascii_100   = str_repeat( '$', 100 );
		$unicode_99  = str_repeat( '€', 99 );
		$unicode_100 = str_repeat( '€', 100 );

		foreach (
			array(
				''           => '',
				$ascii_99    => $ascii_99,
				$ascii_100   => '',
				$unicode_99  => $unicode_99,
				$unicode_100 => '',
			) as $input => $expected
		) {
			$clean = Schema_Settings::sanitize(
				array(
					'localBusiness' => array( 'priceRange' => $input ),
				)
			);

			$this->assertSame( $expected, $clean['localBusiness']['priceRange'] );
		}
	}

	/**
	 * Invalid or partial geo input clears both endpoints; valid input is preserved.
	 */
	public function test_sanitize_geo_requires_valid_pair() {
		$clean = Schema_Settings::sanitize(
			array(
				'localBusiness' => array(
					'geo' => array(
						'latitude'  => '40.7128',
						'longitude' => '-74.0060',
					),
				),
			)
		);
		$this->assertSame(
			array(
				'latitude'  => '40.7128',
				'longitude' => '-74.0060',
			),
			$clean['localBusiness']['geo']
		);

		$clean = Schema_Settings::sanitize(
			array(
				'localBusiness' => array(
					'geo' => array(
						'latitude'  => '40.7128',
						'longitude' => 'not-a-number',
					),
				),
			)
		);
		$this->assertSame(
			array(
				'latitude'  => '',
				'longitude' => '',
			),
			$clean['localBusiness']['geo']
		);
	}

	/**
	 * `update()` persists the sanitized submission and returns the new effective
	 * settings, with stored overrides winning over the site-identity defaults.
	 */
	public function test_update_persists_and_returns_effective_overrides() {
		$this->set_site_identity( 'Acme Co', 'Default tagline' );

		$effective = Schema_Settings::update(
			array(
				'organization' => array(
					'name'        => 'Acme Corporation',
					'description' => 'Custom description',
					'sameAs'      => array( 'https://twitter.com/acme' ),
					'email'       => 'hello@acme.test',
				),
			)
		);

		// The returned effective settings reflect the overrides.
		$this->assertSame( 'Acme Corporation', $effective['organization']['name'] );
		$this->assertSame( 'Custom description', $effective['organization']['description'] );
		$this->assertSame( array( 'https://twitter.com/acme' ), $effective['organization']['sameAs'] );
		$this->assertSame( 'hello@acme.test', $effective['organization']['email'] );

		// And they're persisted: a fresh read returns the same overrides.
		$reread = Schema_Settings::get_organization();
		$this->assertSame( 'Acme Corporation', $reread['name'] );
		$this->assertSame( array( 'https://twitter.com/acme' ), $reread['sameAs'] );
	}

	/**
	 * Updating one schema section preserves the other stored section.
	 */
	public function test_update_replaces_only_present_sections() {
		Schema_Settings::update(
			array(
				'organization'  => array(
					'name'   => 'Acme Corporation',
					'sameAs' => array( 'https://twitter.com/acme' ),
				),
				'localBusiness' => array(
					'enabled' => true,
					'address' => array(
						'streetAddress' => '123 Main St',
					),
				),
			)
		);

		Schema_Settings::update(
			array(
				'organization' => array(
					'name' => 'Acme Labs',
				),
			)
		);
		$editable = Schema_Settings::get_editable();
		$this->assertSame( 'Acme Labs', $editable['organization']['name'] );
		$this->assertSame( '123 Main St', $editable['localBusiness']['address']['streetAddress'] );

		Schema_Settings::update(
			array(
				'localBusiness' => array(
					'enabled' => true,
					'address' => array(
						'streetAddress' => '456 Oak Ave',
					),
				),
			)
		);
		$editable = Schema_Settings::get_editable();
		$this->assertSame( 'Acme Labs', $editable['organization']['name'] );
		$this->assertSame( '456 Oak Ave', $editable['localBusiness']['address']['streetAddress'] );
	}

	/**
	 * WooCommerce store options provide LocalBusiness address defaults.
	 */
	public function test_woo_address_defaults_map_store_options() {
		update_option( 'woocommerce_store_address', '123 Main St' );
		update_option( 'woocommerce_store_address_2', 'Suite 5' );
		update_option( 'woocommerce_store_city', 'New York' );
		update_option( 'woocommerce_store_postcode', '10001' );
		update_option( 'woocommerce_default_country', 'US:NY' );

		$defaults = Schema_Settings::get_defaults();

		$this->assertSame(
			array(
				'streetAddress'   => '123 Main St, Suite 5',
				'addressLocality' => 'New York',
				'addressRegion'   => 'NY',
				'postalCode'      => '10001',
				'addressCountry'  => 'US',
			),
			$defaults['localBusiness']['address']
		);

		// Woo stores a country with no state as just the country code (no colon).
		update_option( 'woocommerce_default_country', 'US' );
		$address = Schema_Settings::get_defaults()['localBusiness']['address'];
		$this->assertSame( 'US', $address['addressCountry'] );
		$this->assertSame( '', $address['addressRegion'] );
	}

	/**
	 * Effective LocalBusiness address falls back per subfield to Woo defaults.
	 */
	public function test_get_local_business_falls_back_per_address_subfield() {
		update_option( 'woocommerce_store_address', '123 Main St' );
		update_option( 'woocommerce_store_city', 'New York' );
		update_option( 'woocommerce_store_postcode', '10001' );
		update_option( 'woocommerce_default_country', 'US:NY' );

		Schema_Settings::update(
			array(
				'localBusiness' => array(
					'enabled'   => true,
					'address'   => array(
						'streetAddress' => '456 Oak Ave',
					),
					'telephone' => '+1 555 123 4567',
				),
			)
		);

		$local_business = Schema_Settings::get_local_business();

		$this->assertTrue( $local_business['enabled'] );
		$this->assertSame( '456 Oak Ave', $local_business['address']['streetAddress'] );
		$this->assertSame( 'New York', $local_business['address']['addressLocality'] );
		$this->assertSame( 'NY', $local_business['address']['addressRegion'] );
		$this->assertSame( '10001', $local_business['address']['postalCode'] );
		$this->assertSame( 'US', $local_business['address']['addressCountry'] );
		$this->assertSame( '+1 555 123 4567', $local_business['telephone'] );
	}

	/**
	 * Empty stored `name` / `description` fall back to live site identity (so the
	 * node never emits an empty name and tracks Site Title changes), while
	 * `sameAs` / `email` come only from storage.
	 */
	public function test_get_organization_falls_back_per_field() {
		$this->set_site_identity( 'Acme Co', 'We make things' );

		// Store only social profiles; leave name/description empty.
		Schema_Settings::update(
			array(
				'organization' => array(
					'sameAs' => array( 'https://twitter.com/acme' ),
				),
			)
		);

		$organization = Schema_Settings::get_organization();

		$this->assertSame( 'Acme Co', $organization['name'] );
		$this->assertSame( 'We make things', $organization['description'] );
		$this->assertSame( array( 'https://twitter.com/acme' ), $organization['sameAs'] );
		$this->assertSame( '', $organization['email'] );
	}
}
