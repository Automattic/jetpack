<?php
/**
 * Tests for the Jetpack_Sitemap_Builder class.
 *
 * @package automattic/jetpack
 * @since 13.4
 */

/**
 * Test class for Jetpack_Sitemap_Builder.
 *
 * @since 13.4
 */
class WP_Test_Jetpack_Sitemap_Builder extends WP_UnitTestCase {

	/**
	 * "lastmod" date from other URLs filter is considered when building a sitemap.
	 *
	 * @covers Jetpack_Sitemap_Builder::build_one_page_sitemap
	 * @group jetpack-sitemap
	 * @since 13.4
	 */
	public function test_build_one_page_sitemap_considers_lastmod_from_other_urls() {
		$other_urls = array(
			array(
				'loc'     => 'https://example.com/1',
				'lastmod' => '2019-01-01T00:00:00Z',
			),
			array(
				'loc'     => 'https://example.com/2',
				'lastmod' => '2024-03-08T01:02:03Z',
			),
			array(
				'loc'     => 'https://example.com/3',
				'lastmod' => '2022-02-02T00:00:00Z',
			),
		);

		$callback = function () use ( $other_urls ) {
			return $other_urls;
		};

		add_filter( 'jetpack_page_sitemap_other_urls', $callback );

		$builder = new Jetpack_Sitemap_Builder();
		$result  = $builder->build_one_page_sitemap( 1, 1 );

		remove_filter( 'jetpack_page_sitemap_other_urls', $callback );

		$this->assertSame( '2024-03-08T01:02:03Z', $result['last_modified'], 'Last modified date is not the one from the other_urls filter.' );
	}
}
