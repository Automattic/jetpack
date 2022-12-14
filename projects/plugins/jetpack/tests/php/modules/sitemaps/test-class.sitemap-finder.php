<?php
/**
 * Tests for the Jetpack_Sitemap_Finder class.
 *
 * @package automattic/jetpack
 * @since 4.7.0
 */

require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemaps.php';
require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-finder.php';

/**
 * Test class for Jetpack_Sitemap_Finder.
 *
 * @since 4.7.0
 */
class WP_Test_Jetpack_Sitemap_Finder extends WP_UnitTestCase {

	/**
	 * Recognize the default master sitemap URI.
	 *
	 * @covers Jetpack_Sitemap_Finder::recognize_sitemap_uri
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_finder_recognize_default_master_sitemap() {
		$finder = new Jetpack_Sitemap_Finder();

		$array = wp_parse_url( $finder->construct_sitemap_url( 'sitemap.xml' ) );

		$result = $finder->recognize_sitemap_uri(
			// Get just the path+query part of the URL.
			$array['path'] . '?' . $array['query']
		);

		$this->assertEquals( 'sitemap.xml', $result['sitemap_name'] );
	}

}
