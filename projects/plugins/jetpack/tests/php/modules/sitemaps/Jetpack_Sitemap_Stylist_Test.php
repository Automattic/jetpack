<?php
/**
 * Tests for the Jetpack_Sitemap_Stylist class.
 *
 * @package automattic/jetpack
 * @since 4.7.0
 */

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

	/** @dataProvider stored_stylesheets */
	#[DataProvider( 'stored_stylesheets' )]
	public function test_stored_xsl_changes_only_the_presentation_instruction( $url, $quote ) {
		$prefix = '<?xml version="1.0" encoding="UTF-8"?>' . "\n<!-- generator='jetpack' -->\n";
		$body   = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://example.org/?a=1&amp;b=2</loc><lastmod>2026-11-20</lastmod></url></urlset>';
		$xml    = $prefix . '<?xml-stylesheet type=' . $quote . 'text/xsl' . $quote . ' href=' . $quote . $url . $quote . '?>' . $body;
		$this->assertSame(
			$prefix . '<?xml-stylesheet type="text/css" href="//example.org/sitemap.css"?>' . $body,
			Jetpack_Sitemap_Stylist::replace_xsl_stylesheet( $xml, '//example.org/sitemap.css' )
		);
	}

	public static function stored_stylesheets() {
		$cases = array();
		foreach ( array( 'sitemap', 'sitemap-index', 'image-sitemap', 'video-sitemap', 'news-sitemap' ) as $name ) {
			$cases[ $name . ' pretty' ] = array( '//old.example.org/maps/' . $name . '.xsl', '"' );
			$cases[ $name . ' plain' ]  = array( 'https://example.org/?jetpack-sitemap=' . $name . '.xsl', "'" );
		}
		return $cases;
	}

	/** @dataProvider preserved_stylesheets */
	#[DataProvider( 'preserved_stylesheets' )]
	public function test_custom_stylesheets_and_xml_data_are_preserved( $xml ) {
		$this->assertSame( $xml, Jetpack_Sitemap_Stylist::replace_xsl_stylesheet( $xml, '//example.org/sitemap.css' ) );
	}

	public static function preserved_stylesheets() {
		return array(
			'custom XSL'    => array( '<?xml-stylesheet type="text/xsl" href="https://example.org/custom.xsl"?><urlset/>' ),
			'CSS'           => array( '<?xml-stylesheet type="text/css" href="//example.org/sitemap.css"?><urlset/>' ),
			'no stylesheet' => array( '<?xml version="1.0"?><urlset/>' ),
			'embedded text' => array( '<urlset><url><loc><![CDATA[<?xml-stylesheet type="text/xsl" href="//example.org/sitemap.xsl"?>]]></loc></url></urlset>' ),
		);
	}
}
