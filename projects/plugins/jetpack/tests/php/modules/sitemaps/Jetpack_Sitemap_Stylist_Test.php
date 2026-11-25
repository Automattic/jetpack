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
	public function test_layout_css_uses_the_host_asset_path( $is_simple, $home, $plugin_url, $expected ) {
		$home_filter   = static fn () => $home;
		$plugin_filter = static fn () => $plugin_url;
		Constants::set_constant( 'IS_WPCOM', $is_simple );
		add_filter( 'home_url', $home_filter );
		add_filter( 'plugins_url', $plugin_filter );
		try {
			$this->assertSame(
				array(
					$expected . '?ver=' . md5_file( JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap.css' ),
					preg_replace( '/^https?:/', '', $home ) . '?jetpack-sitemap=sitemap-labels.css',
				),
				Jetpack_Sitemap_Stylist::sitemap_stylesheet_urls()
			);
		} finally {
			remove_filter( 'home_url', $home_filter );
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
		$mu_asset = '/wp-content/mu-plugins/jetpack-plugin/sun/modules/sitemaps/sitemap.css';
		return array(
			'Simple on a subdirectory'           => array( true, 'https://example.org/blog/', 'https://example.org/blog' . $mu_asset, '//example.org' . $mu_asset ),
			'Simple with root-relative URL'      => array( true, 'https://example.org/company/news/', '/company/news' . $mu_asset, $mu_asset ),
			'Simple with a CDN asset'            => array( true, 'https://example.org/blog/', 'https://cdn.example.org' . $mu_asset, '//cdn.example.org' . $mu_asset ),
			'Self-hosted subdirectory MU plugin' => array( false, 'https://example.org/blog/', 'https://example.org/blog' . $mu_asset, '//example.org/blog' . $mu_asset ),
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
