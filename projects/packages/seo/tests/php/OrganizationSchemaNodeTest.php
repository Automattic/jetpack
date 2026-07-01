<?php
/**
 * Tests for the Jetpack SEO Organization_Schema_Node builder.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Organization_Schema_Node
 */
#[CoversClass( Organization_Schema_Node::class )]
class OrganizationSchemaNodeTest extends TestCase {

	/**
	 * Give the site a stable identity (Site Title, Tagline, home URL) for the test.
	 *
	 * @param string $name        Site Title.
	 * @param string $description Tagline.
	 * @param string $home        Home URL.
	 * @return void
	 */
	private function set_site_identity( $name, $description = '', $home = 'https://example.test/' ) {
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
		add_filter(
			'home_url',
			static function () use ( $home ) {
				return $home;
			}
		);
		add_filter(
			'pre_option_home',
			static function () use ( $home ) {
				return $home;
			}
		);
	}

	/**
	 * Remove the filters added by the tests so they don't leak across the process.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		foreach (
			array(
				'pre_option_blogname',
				'pre_option_blogdescription',
				'pre_option_home',
				'home_url',
				'get_site_icon_url',
				'wp_get_attachment_image_src',
			) as $hook
		) {
			remove_all_filters( $hook );
		}
		remove_theme_mod( 'custom_logo' );
		parent::tearDown();
	}

	/**
	 * With no Site Title, there is no useful Organization entity, so nothing is built.
	 */
	public function test_emits_nothing_without_a_site_name() {
		$this->set_site_identity( '' );
		$this->assertNull( Organization_Schema_Node::build() );
	}

	/**
	 * The node is built from site identity alone, with a stable `@id` matching the
	 * shared Organization id used for cross-references.
	 */
	public function test_builds_from_site_identity() {
		$this->set_site_identity( 'Acme Co', 'We make things', 'https://acme.test/' );

		$node = Organization_Schema_Node::build();

		$this->assertIsArray( $node );
		$this->assertSame( 'Organization', $node['@type'] );
		$this->assertSame( Schema_Node_Ids::organization(), $node['@id'] );
		$this->assertSame( 'https://acme.test/#organization', $node['@id'] );
		$this->assertSame( 'Acme Co', $node['name'] );
		$this->assertSame( 'https://acme.test/', $node['url'] );
		$this->assertSame( 'We make things', $node['description'] );
	}

	/**
	 * With no tagline, the `description` is omitted rather than emitted empty.
	 */
	public function test_description_omitted_when_tagline_empty() {
		$this->set_site_identity( 'Acme Co', '' );
		$node = Organization_Schema_Node::build();
		$this->assertArrayNotHasKey( 'description', $node );
	}

	/**
	 * The Site Icon provides the logo ImageObject when no Site Logo is set.
	 */
	public function test_logo_falls_back_to_site_icon() {
		$this->set_site_identity( 'Acme Co' );
		add_filter(
			'get_site_icon_url',
			static function () {
				return 'https://acme.test/icon.png';
			}
		);

		$node = Organization_Schema_Node::build();

		$this->assertSame( 'ImageObject', $node['logo']['@type'] );
		$this->assertSame( 'https://acme.test/icon.png', $node['logo']['url'] );
	}

	/**
	 * The Site Logo (Customizer `custom_logo`) is preferred over the Site Icon and
	 * carries its dimensions when available.
	 */
	public function test_logo_prefers_custom_logo_with_dimensions() {
		$this->set_site_identity( 'Acme Co' );
		set_theme_mod( 'custom_logo', 42 );
		add_filter(
			'wp_get_attachment_image_src',
			static function () {
				return array( 'https://acme.test/logo.png', 120, 60 );
			}
		);
		// A Site Icon also exists, but the Site Logo must win.
		add_filter(
			'get_site_icon_url',
			static function () {
				return 'https://acme.test/icon.png';
			}
		);

		$node = Organization_Schema_Node::build();

		$this->assertSame( 'https://acme.test/logo.png', $node['logo']['url'] );
		$this->assertSame( 120, $node['logo']['width'] );
		$this->assertSame( 60, $node['logo']['height'] );
	}

	/**
	 * `sameAs` comes only from settings (WordPress has no site-level source) and is
	 * sanitized before emission — the exhaustive URL rules live in SchemaSettingsTest;
	 * here we just confirm invalid entries are dropped and duplicates removed.
	 */
	public function test_same_as_from_settings_is_sanitized() {
		$this->set_site_identity( 'Acme Co' );

		$node = Organization_Schema_Node::build(
			array(
				'sameAs' => array(
					'https://example.test/twitter',
					'/relative-profile',
					'https://example.test/twitter',
					'https://example.test/facebook',
				),
			)
		);

		$this->assertSame(
			array(
				'https://example.test/twitter',
				'https://example.test/facebook',
			),
			$node['sameAs']
		);
	}

	/**
	 * Without configured social profiles, `sameAs` is omitted entirely.
	 */
	public function test_same_as_omitted_when_unconfigured() {
		$this->set_site_identity( 'Acme Co' );
		$this->assertArrayNotHasKey( 'sameAs', Organization_Schema_Node::build() );
	}

	/**
	 * `email` is included only when provided in settings (never auto-filled), and
	 * is sanitized.
	 */
	public function test_email_only_from_settings() {
		$this->set_site_identity( 'Acme Co' );

		$this->assertArrayNotHasKey( 'email', Organization_Schema_Node::build() );

		$node = Organization_Schema_Node::build( array( 'email' => 'hello@acme.test' ) );
		$this->assertSame( 'hello@acme.test', $node['email'] );
	}

	/**
	 * Settings override the site-identity defaults for `name` and `description`.
	 */
	public function test_settings_override_site_identity() {
		$this->set_site_identity( 'Acme Co', 'Default tagline' );

		$node = Organization_Schema_Node::build(
			array(
				'name'        => 'Acme Corporation',
				'description' => 'Custom description',
			)
		);

		$this->assertSame( 'Acme Corporation', $node['name'] );
		$this->assertSame( 'Custom description', $node['description'] );
	}

	/**
	 * A malformed `sameAs` (not an array) is ignored rather than emitted.
	 */
	public function test_non_array_same_as_is_ignored() {
		$this->set_site_identity( 'Acme Co' );
		$node = Organization_Schema_Node::build( array( 'sameAs' => 'https://twitter.com/acme' ) );
		$this->assertArrayNotHasKey( 'sameAs', $node );
	}

	/**
	 * A malformed (non-string) `name` setting falls back to the site title rather
	 * than producing an invalid node.
	 */
	public function test_non_string_name_falls_back_to_site_title() {
		$this->set_site_identity( 'Acme Co' );
		$node = Organization_Schema_Node::build( array( 'name' => array( 'unexpected' ) ) );
		$this->assertSame( 'Acme Co', $node['name'] );
	}
}
