<?php
/**
 * Tests for the Jetpack SEO Website_Schema_Node builder.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Website_Schema_Node
 */
#[CoversClass( Website_Schema_Node::class )]
class WebsiteSchemaNodeTest extends TestCase {

	/**
	 * Give the site a stable identity for the test.
	 *
	 * @param string $name        Site Title.
	 * @param string $description Tagline.
	 * @param string $home        Home URL.
	 * @param string $locale      Locale.
	 * @return void
	 */
	private function set_site_identity( $name, $description = '', $home = 'https://example.test/', $locale = 'en_US' ) {
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
			static function ( $url, $path = '' ) use ( $home ) {
				return rtrim( $home, '/' ) . $path;
			},
			10,
			2
		);
		add_filter(
			'locale',
			static function () use ( $locale ) {
				return $locale;
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
				'home_url',
				'locale',
			) as $hook
		) {
			remove_all_filters( $hook );
		}
		parent::tearDown();
	}

	/**
	 * With no Site Title, there is no useful WebSite entity, so nothing is built.
	 */
	public function test_emits_nothing_without_a_site_name() {
		$this->set_site_identity( '' );
		$this->assertNull( Website_Schema_Node::build() );
	}

	/**
	 * The node is built from site identity alone, with a stable `@id` and core
	 * WordPress search as the SearchAction target.
	 */
	public function test_builds_from_site_identity() {
		$this->set_site_identity( 'Acme Co', 'We make things', 'https://acme.test/', 'es_UY' );

		$node = Website_Schema_Node::build();

		$this->assertIsArray( $node );
		$this->assertSame( 'WebSite', $node['@type'] );
		$this->assertSame( Schema_Node_Ids::website(), $node['@id'] );
		$this->assertSame( 'https://acme.test/#website', $node['@id'] );
		$this->assertSame( 'Acme Co', $node['name'] );
		$this->assertSame( 'https://acme.test/', $node['url'] );
		$this->assertSame( 'We make things', $node['description'] );
		$this->assertSame( 'es-UY', $node['inLanguage'] );
		$this->assertSame(
			array(
				'@type'       => 'SearchAction',
				'target'      => array(
					'@type'       => 'EntryPoint',
					'urlTemplate' => 'https://acme.test/?s={search_term_string}',
				),
				'query-input' => 'required name=search_term_string',
			),
			$node['potentialAction']
		);
	}

	/**
	 * With no tagline or language, optional properties are omitted rather than
	 * emitted empty.
	 */
	public function test_optional_fields_omitted_when_empty() {
		$this->set_site_identity( 'Acme Co', '', 'https://acme.test/', '' );
		$node = Website_Schema_Node::build();

		$this->assertArrayNotHasKey( 'description', $node );
		$this->assertArrayNotHasKey( 'inLanguage', $node );
	}
}
