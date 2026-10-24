<?php
/**
 * Tests for the Jetpack SEO Person_Schema_Node builder (the site-level Person).
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Person_Schema_Node
 */
#[CoversClass( Person_Schema_Node::class )]
class PersonSchemaNodeTest extends TestCase {

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
	 * With no Site Title, there is no useful Person entity, so nothing is built.
	 */
	public function test_emits_nothing_without_a_site_name() {
		$this->set_site_identity( '' );
		$this->assertNull( Person_Schema_Node::build() );
	}

	/**
	 * The node is built from site identity alone, with the stable site-Person `@id`.
	 */
	public function test_builds_from_site_identity() {
		$this->set_site_identity( 'Jane Rivera', 'Product manager', 'https://jane.test/' );

		$node = Person_Schema_Node::build();

		$this->assertIsArray( $node );
		$this->assertSame( 'Person', $node['@type'] );
		$this->assertSame( Schema_Node_Ids::site_person(), $node['@id'] );
		$this->assertSame( 'https://jane.test/#person', $node['@id'] );
		$this->assertSame( 'Jane Rivera', $node['name'] );
		$this->assertSame( 'https://jane.test/', $node['url'] );
		$this->assertSame( 'Product manager', $node['description'] );
	}

	/**
	 * With no tagline, the `description` is omitted rather than emitted empty.
	 */
	public function test_description_omitted_when_tagline_empty() {
		$this->set_site_identity( 'Jane Rivera', '' );
		$node = Person_Schema_Node::build();
		$this->assertArrayNotHasKey( 'description', $node );
	}

	/**
	 * The Site Icon provides the image ImageObject when no Site Logo is set.
	 */
	public function test_image_falls_back_to_site_icon() {
		$this->set_site_identity( 'Jane Rivera' );
		add_filter(
			'get_site_icon_url',
			static function () {
				return 'https://jane.test/icon.png';
			}
		);

		$node = Person_Schema_Node::build();

		$this->assertSame( 'ImageObject', $node['image']['@type'] );
		$this->assertSame( 'https://jane.test/icon.png', $node['image']['url'] );
	}

	/**
	 * The Site Logo (Customizer `custom_logo`) is preferred over the Site Icon and
	 * carries its dimensions when available.
	 */
	public function test_image_prefers_custom_logo_with_dimensions() {
		$this->set_site_identity( 'Jane Rivera' );
		set_theme_mod( 'custom_logo', 42 );
		add_filter(
			'wp_get_attachment_image_src',
			static function () {
				return array( 'https://jane.test/photo.png', 120, 120 );
			}
		);
		add_filter(
			'get_site_icon_url',
			static function () {
				return 'https://jane.test/icon.png';
			}
		);

		$node = Person_Schema_Node::build();

		$this->assertSame( 'https://jane.test/photo.png', $node['image']['url'] );
		$this->assertSame( 120, $node['image']['width'] );
		$this->assertSame( 120, $node['image']['height'] );
	}

	/**
	 * `sameAs` comes only from settings and is sanitized before emission.
	 */
	public function test_same_as_from_settings_is_sanitized() {
		$this->set_site_identity( 'Jane Rivera' );

		$node = Person_Schema_Node::build(
			array(
				'sameAs' => array(
					'https://example.test/linkedin',
					'/relative-profile',
					'https://example.test/linkedin',
					'https://example.test/github',
				),
			)
		);

		$this->assertSame(
			array(
				'https://example.test/linkedin',
				'https://example.test/github',
			),
			$node['sameAs']
		);
	}

	/**
	 * Without configured social profiles, `sameAs` is omitted entirely.
	 */
	public function test_same_as_omitted_when_unconfigured() {
		$this->set_site_identity( 'Jane Rivera' );
		$this->assertArrayNotHasKey( 'sameAs', Person_Schema_Node::build() );
	}

	/**
	 * Settings override the site-identity defaults for `name` and `description`.
	 */
	public function test_settings_override_site_identity() {
		$this->set_site_identity( 'Jane Rivera', 'Default tagline' );

		$node = Person_Schema_Node::build(
			array(
				'name'        => 'Jane A. Rivera',
				'description' => 'Custom bio',
			)
		);

		$this->assertSame( 'Jane A. Rivera', $node['name'] );
		$this->assertSame( 'Custom bio', $node['description'] );
	}

	/**
	 * A malformed (non-string) `name` setting falls back to the site title rather
	 * than producing an invalid node.
	 */
	public function test_non_string_name_falls_back_to_site_title() {
		$this->set_site_identity( 'Jane Rivera' );
		$node = Person_Schema_Node::build( array( 'name' => array( 'unexpected' ) ) );
		$this->assertSame( 'Jane Rivera', $node['name'] );
	}
}
