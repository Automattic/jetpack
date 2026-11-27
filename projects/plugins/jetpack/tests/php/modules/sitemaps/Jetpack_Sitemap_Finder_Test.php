<?php
/**
 * Tests for the Jetpack_Sitemap_Finder class.
 *
 * @package automattic/jetpack
 * @since 4.7.0
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemaps.php';
require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-finder.php';

/**
 * Test class for Jetpack_Sitemap_Finder.
 *
 * @since 4.7.0
 * @covers \Jetpack_Sitemap_Finder
 */
#[CoversClass( Jetpack_Sitemap_Finder::class )]
class Jetpack_Sitemap_Finder_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Recognize the default master sitemap URI.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_finder_recognize_default_master_sitemap() {
		$finder = new Jetpack_Sitemap_Finder();

		$array = wp_parse_url( $finder->construct_sitemap_url( 'sitemap.xml' ) );

		$result = $finder->recognize_sitemap_uri(
			// Get just the path+query part of the URL.
			$array['path'] . '?' . $array['query']
		);

		$this->assertEquals( 'sitemap.xml', $result['sitemap_name'] );
	}
	/** @dataProvider label_routes */
	#[DataProvider( 'label_routes' )]
	public function test_label_query_bypasses_permalink_and_custom_location_routes( $permalinks, $uri, $expected ) {
		global $wp_rewrite;
		$wp_rewrite->set_permalink_structure( $permalinks );
		update_option( 'jetpack_sitemap_location', '/maps' );
		try {
			$this->assertSame( $expected, ( new Jetpack_Sitemap_Finder() )->recognize_sitemap_uri( $uri )['sitemap_name'] );
		} finally {
			delete_option( 'jetpack_sitemap_location' );
			$wp_rewrite->set_permalink_structure( '' );
		}
	}

	public static function label_routes() {
		return array(
			'plain'     => array( '', '/?jetpack-sitemap=sitemap-labels.css', 'sitemap-labels.css' ),
			'pretty'    => array( '/%postname%/', '/?jetpack-sitemap=sitemap-labels.css', 'sitemap-labels.css' ),
			'index'     => array( '/index.php/%postname%/', '/?jetpack-sitemap=sitemap-labels.css', 'sitemap-labels.css' ),
			'subfolder' => array( '/%postname%/', '/blog/?other=value&jetpack-sitemap=sitemap-labels.css', 'sitemap-labels.css' ),
			'other'     => array( '/%postname%/', '/?jetpack-sitemap=not-sitemap.css', null ),
		);
	}
}
