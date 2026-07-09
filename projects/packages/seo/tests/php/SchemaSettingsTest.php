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
	 * Start each test from a clean option.
	 *
	 * @return void
	 */
	protected function setUp(): void {
		parent::setUp();
		delete_option( Schema_Settings::OPTION_NAME );
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
