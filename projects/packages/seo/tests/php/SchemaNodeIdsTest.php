<?php
/**
 * Tests for the Jetpack SEO Schema_Node_Ids helpers.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\SEO\Schema_Node_Ids
 */
#[CoversClass( Schema_Node_Ids::class )]
class SchemaNodeIdsTest extends TestCase {

	/**
	 * Remove the home_url filter a test added so it doesn't leak across the process.
	 *
	 * @return void
	 */
	protected function tearDown(): void {
		remove_all_filters( 'home_url' );
		parent::tearDown();
	}

	/**
	 * The Organization id is the site root plus a stable `#organization` fragment,
	 * so it resolves to the same entity on every page.
	 */
	public function test_organization_id_anchors_to_the_site_root() {
		add_filter(
			'home_url',
			static function () {
				return 'https://example.test/';
			}
		);

		$this->assertSame( 'https://example.test/#organization', Schema_Node_Ids::organization() );
	}

	/**
	 * The id is stable across calls — it must not vary per request, or the cross-node
	 * `@id` references (e.g. the Article publisher) would not resolve.
	 */
	public function test_organization_id_is_stable() {
		add_filter(
			'home_url',
			static function () {
				return 'https://example.test/';
			}
		);

		$this->assertSame( Schema_Node_Ids::organization(), Schema_Node_Ids::organization() );
	}
}
