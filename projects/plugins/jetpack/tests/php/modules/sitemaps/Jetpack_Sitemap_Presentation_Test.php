<?php
/**
 * Sitemap presentation metadata regressions.
 *
 * @package automattic/jetpack
 */

// phpcs:disable WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase -- DOM properties.

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemaps.php';

/** Tests metadata without consuming sitemap entries.
 *
 * @covers \Jetpack_Sitemap_Buffer
 * @covers \Jetpack_Sitemap_Buffer_XMLWriter
 * @covers \Jetpack_Sitemap_Stylist
 */
#[CoversClass( Jetpack_Sitemap_Stylist::class )]
#[CoversClass( Jetpack_Sitemap_Buffer::class )]
#[CoversClass( Jetpack_Sitemap_Buffer_XMLWriter::class )]
class Jetpack_Sitemap_Presentation_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/** @dataProvider sitemap_types */
	#[DataProvider( 'sitemap_types' )]
	public function test_title_preserves_empty_state_and_entry_capacity( $type, $title, $suffix ) {
		$class = 'Jetpack_Sitemap_Buffer_' . ucfirst( $type ) . $suffix;
		$empty = new $class( 1, 4096, '2026-11-24 00:00:00' );
		$doc   = new DOMDocument();
		$this->assertTrue( $doc->loadXML( $empty->contents() ) );
		$this->assertTrue( $empty->is_empty() );
		$this->assertSame( 1, $doc->getElementsByTagNameNS( 'http://www.w3.org/1999/xhtml', 'title' )->length );
		$this->assertSame( $title, $doc->getElementsByTagNameNS( 'http://www.w3.org/1999/xhtml', 'title' )->item( 0 )->textContent );
		$this->assertSame( 'http://www.w3.org/1999/xhtml', $doc->documentElement->getElementsByTagName( '*' )->item( 0 )->namespaceURI );
		$this->assertStringContainsString( 'http://www.w3.org/1999/xhtml https://www.w3.org/2002/08/xhtml/xhtml1-strict.xsd', $doc->documentElement->getAttributeNS( 'http://www.w3.org/2001/XMLSchema-instance', 'schemaLocation' ) );

		$buffer = new $class( 1, 4096, '2026-11-24 00:00:00' );
		$entry  = array( 'master' === $type ? 'sitemap' : 'url' => array( 'loc' => 'https://example.org/article/' ) );
		if ( 'video' === $type ) {
			$entry['url']['video:video'] = array(
				'video:title'         => 'Field notes',
				'video:thumbnail_loc' => 'https://example.org/thumbnail.jpg',
				'video:description'   => 'A short field video.',
				'video:content_loc'   => 'https://example.org/video.mp4',
			);
		}
		$this->assertTrue( $buffer->append( $entry ) );
		$this->assertFalse( $buffer->is_empty() );
		$this->assertFalse( $buffer->append( $entry ) );
		$this->assertTrue( $doc->loadXML( $buffer->contents() ) );
		$this->assertSame( 1, $doc->getElementsByTagNameNS( 'http://www.sitemaps.org/schemas/sitemap/0.9', 'loc' )->length );
	}

	public static function sitemap_types() {
		$cases = array();
		foreach ( array(
			'master' => 'XML Sitemap Index',
			'page'   => 'XML Sitemap',
			'image'  => 'Image Sitemap',
			'video'  => 'Video Sitemap',
			'news'   => 'News Sitemap',
		) as $type => $title ) {
			foreach ( array( '', '_XMLWriter' ) as $suffix ) {
				$cases[ $type . $suffix ] = array( $type, $title, $suffix );
			}
		}
		return $cases;
	}

	public function test_title_bytes_are_reserved_before_accepting_entries() {
		foreach ( array( 'Jetpack_Sitemap_Buffer_Page', 'Jetpack_Sitemap_Buffer_Page_XMLWriter' ) as $class ) {
			$buffer = new $class( 1, 350, '2026-11-24 00:00:00' );
			$this->assertFalse( $buffer->append( array( 'url' => array( 'loc' => 'https://example.org/' ) ) ), $class );
			$this->assertTrue( $buffer->is_empty() );
		}
	}
}
