<?php
/**
 * Tests for the Jetpack_Sitemap_Stylist class.
 *
 * @package automattic/jetpack
 * @since 4.7.0
 */

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-stylist.php';

/**
 * Test class for Jetpack_Sitemap_Stylist.
 *
 * @since 4.7.0
 * @covers \Jetpack_Sitemap_Stylist
 */
#[CoversClass( Jetpack_Sitemap_Stylist::class )]
class Jetpack_Sitemap_Stylist_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Check that the sitemap XSL is valid XML.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_stylist_sitemap_xsl_is_valid() {
		// The sitemap xsl.
		$result = simplexml_load_string( Jetpack_Sitemap_Stylist::sitemap_xsl() );

		$this->assertNotFalse( $result );
	}

	/**
	 * Check that the sitemap XSL has root element 'stylesheet'
	 * in the 'xsl' namespace.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_stylist_sitemap_xsl_is_xsl_stylesheet() {
		$result = simplexml_load_string( Jetpack_Sitemap_Stylist::sitemap_xsl() );

		// Assume that simplexml_load_string succeeded.
		$this->assertEquals( 'stylesheet', $result->getName() );

		$namespaces = array_keys( $result->getNamespaces() );
		$this->assertEquals( array( 'xsl' ), $namespaces );
	}

	/**
	 * Check that the sitemap index XSL is valid XML.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_stylist_sitemap_index_xsl_is_valid() {
		// The sitemap index xsl.
		$result = simplexml_load_string( Jetpack_Sitemap_Stylist::sitemap_index_xsl() );

		$this->assertNotFalse( $result );
	}

	/**
	 * Check that the sitemap index XSL has root element 'stylesheet'
	 * in the 'xsl' namespace.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_stylist_sitemap_index_xsl_is_xsl_stylesheet() {
		$result = simplexml_load_string( Jetpack_Sitemap_Stylist::sitemap_index_xsl() );

		// Assume that simplexml_load_string succeeded.
		$this->assertEquals( 'stylesheet', $result->getName() );

		$namespaces = array_keys( $result->getNamespaces() );
		$this->assertEquals( array( 'xsl' ), $namespaces );
	}

	/**
	 * Check that the image sitemap XSL is valid XML.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_stylist_image_sitemap_xsl_is_valid() {
		// The image sitemap xsl.
		$result = simplexml_load_string( Jetpack_Sitemap_Stylist::image_sitemap_xsl() );

		$this->assertNotFalse( $result );
	}

	/**
	 * Check that the image sitemap XSL has root element 'stylesheet'
	 * in the 'xsl' namespace.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_stylist_image_sitemap_xsl_is_xsl_stylesheet() {
		$result = simplexml_load_string( Jetpack_Sitemap_Stylist::image_sitemap_xsl() );

		// Assume that simplexml_load_string succeeded.
		$this->assertEquals( 'stylesheet', $result->getName() );

		$namespaces = array_keys( $result->getNamespaces() );
		$this->assertEquals( array( 'xsl' ), $namespaces );
	}

	/**
	 * Check that the news sitemap XSL is valid XML.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_stylist_news_sitemap_xsl_is_valid() {
		// The news sitemap xsl.
		$result = simplexml_load_string( Jetpack_Sitemap_Stylist::news_sitemap_xsl() );

		$this->assertNotFalse( $result );
	}

	/**
	 * Check that the news_sitemap XSL has root element 'stylesheet'
	 * in the 'xsl' namespace.
	 *
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_sitemap_stylist_news_sitemap_xsl_is_xsl_stylesheet() {
		$result = simplexml_load_string( Jetpack_Sitemap_Stylist::news_sitemap_xsl() );

		// Assume that simplexml_load_string succeeded.
		$this->assertEquals( 'stylesheet', $result->getName() );

		$namespaces = array_keys( $result->getNamespaces() );
		$this->assertEquals( array( 'xsl' ), $namespaces );
	}

	/**
	 * @dataProvider layout_url_cases
	 */
	#[DataProvider( 'layout_url_cases' )]
	public function test_layout_css_uses_the_host_asset_path( $is_simple, $home, $site, $plugin_url, $expected ) {
		$home_filter   = static fn () => $home;
		$site_filter   = static fn () => $site;
		$plugin_filter = static fn () => $plugin_url;
		Constants::set_constant( 'IS_WPCOM', $is_simple );
		add_filter( 'home_url', $home_filter );
		add_filter( 'site_url', $site_filter );
		add_filter( 'plugins_url', $plugin_filter );
		try {
			$this->assertSame(
				array(
					str_replace( 'VERSION', md5_file( JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap.css' ), $expected ),
					preg_replace( '/^https?:/', '', $home ) . '?jetpack-sitemap=sitemap-labels.css',
				),
				Jetpack_Sitemap_Stylist::sitemap_stylesheet_urls()
			);
		} finally {
			remove_filter( 'home_url', $home_filter );
			remove_filter( 'site_url', $site_filter );
			remove_filter( 'plugins_url', $plugin_filter );
			Constants::clear_single_constant( 'IS_WPCOM' );
		}
	}

	/**
	 * Asset URLs for path-based sites and host or plugin configurations that already resolve.
	 *
	 * @return array Test cases.
	 */
	public static function layout_url_cases() {
		$asset  = '/wp-content/mu-plugins/jetpack-plugin/sun/modules/sitemaps/sitemap.css';
		$home   = 'https://example.org/blog/';
		$alias  = 'https://alias.example.org/';
		$root   = '//example.org' . $asset . '?ver=VERSION';
		$suffix = '?ver=VERSION';
		return array(
			'Canonical home with alias asset'         => array( true, $home, $alias, $alias . ltrim( $asset, '/' ), $root ),
			'Already canonical root asset'            => array( true, $home, $alias, 'https://example.org' . $asset, $root ),
			'Already rewritten canonical path'        => array( true, $home, $alias, 'https://example.org/blog' . $asset, $root ),
			'Nested canonical path with alias asset'  => array( true, 'https://example.org/fr/blog/', $alias, $alias . ltrim( $asset, '/' ), $root ),
			'Nested canonical path already rewritten' => array( true, 'https://example.org/fr/blog/', $alias, 'https://example.org/fr/blog' . $asset, $root ),
			'Root-relative nested asset'              => array( true, 'https://example.org/company/news/', $alias, '/company/news' . $asset, $root ),
			'Root-relative root asset'                => array( true, $home, $alias, $asset, $root ),
			'Scheme-relative alias asset'             => array( true, $home, $alias, '//alias.example.org' . $asset, $root ),
			'Uppercase local hostname'                => array( true, $home, $alias, 'https://ALIAS.EXAMPLE.ORG' . $asset, $root ),
			'Simple without a site path'              => array( true, 'https://example.org/', 'https://example.org/', 'https://example.org' . $asset, $root ),
			'Mapped root with alias asset'            => array( true, 'https://example.org/', $alias, $alias . ltrim( $asset, '/' ), $root ),
			'Plain HTTP mapped site'                  => array( true, 'http://example.org/blog/', 'http://alias.example.org/', 'http://alias.example.org' . $asset, $root ),
			'Local asset query and fragment'          => array( true, $home, $alias, $alias . ltrim( $asset, '/' ) . '?build=one#section', '//example.org' . $asset . '?build=one&ver=VERSION#section' ),
			'Canonical hostname and port'             => array( true, 'https://example.org:8443/blog/', 'https://alias.example.org:8443/', 'https://alias.example.org:8443' . $asset, '//example.org:8443' . $asset . $suffix ),
			'External CDN root'                       => array( true, $home, $alias, 'https://cdn.example.org' . $asset, '//cdn.example.org' . $asset . $suffix ),
			'External CDN with site path'             => array( true, $home, $alias, 'https://cdn.example.org/blog' . $asset, '//cdn.example.org/blog' . $asset . $suffix ),
			'Local hostname on a different port'      => array( true, $home, $alias, 'https://alias.example.org:8080/blog' . $asset, '//alias.example.org:8080/blog' . $asset . $suffix ),
			'Custom local asset path'                 => array( true, $home, $alias, $alias . 'assets/sitemap.css', '//alias.example.org/assets/sitemap.css' . $suffix ),
			'Custom local path under the site'        => array( true, $home, $alias, 'https://example.org/blog/assets/sitemap.css', '//example.org/blog/assets/sitemap.css' . $suffix ),
			'Self-hosted subdirectory MU plugin'      => array( false, $home, $home, 'https://example.org/blog' . $asset, '//example.org/blog' . $asset . $suffix ),
			'Self-hosted subdirectory plugin'         => array( false, $home, $home, 'https://example.org/blog/wp-content/plugins/jetpack/sitemap.css', '//example.org/blog/wp-content/plugins/jetpack/sitemap.css' . $suffix ),
			'Atomic root plugin'                      => array( false, 'https://example.org/', 'https://example.org/', 'https://example.org/wp-content/plugins/jetpack/sitemap.css', '//example.org/wp-content/plugins/jetpack/sitemap.css' . $suffix ),
		);
	}

	public function test_css_escapes_translated_quotes_backslashes_and_line_breaks() {
		$translate = static function ( $translation, $text, $domain ) {
			return 'jetpack' === $domain && 'XML Sitemap' === $text ? "A \"quoted\" \\ title\nnext line" : $translation;
		};
		add_filter( 'gettext', $translate, 10, 3 );
		try {
			$this->assertStringContainsString( '--jetpack-sitemap-title: "A \"quoted\" \\\\ title next line";', Jetpack_Sitemap_Stylist::sitemap_css() );
		} finally {
			remove_filter( 'gettext', $translate );
		}
	}
}
