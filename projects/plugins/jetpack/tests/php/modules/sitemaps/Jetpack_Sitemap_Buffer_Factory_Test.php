<?php

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap-buffer-factory.php';

/**
 * Test class for Jetpack_Sitemap_Buffer_Factory
 *
 * @since 14.6
 * @package automattic/jetpack
 * @covers Jetpack_Sitemap_Buffer_Factory
 */
#[CoversClass( Jetpack_Sitemap_Buffer_Factory::class )]
class Jetpack_Sitemap_Buffer_Factory_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test creating a page buffer with XMLWriter.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_create_page_buffer_xmlwriter() {
		$buffer = Jetpack_Sitemap_Buffer_Factory::create( 'page', 2, 1000 );
		$this->assertInstanceOf( 'Jetpack_Sitemap_Buffer_Page_XMLWriter', $buffer );
	}

	/**
	 * Test creating an image buffer with XMLWriter.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_create_image_buffer_xmlwriter() {
		$buffer = Jetpack_Sitemap_Buffer_Factory::create( 'image', 2, 1000 );
		$this->assertInstanceOf( 'Jetpack_Sitemap_Buffer_Image_XMLWriter', $buffer );
	}

	/**
	 * Test creating a video buffer with XMLWriter.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_create_video_buffer_xmlwriter() {
		$buffer = Jetpack_Sitemap_Buffer_Factory::create( 'video', 2, 1000 );
		$this->assertInstanceOf( 'Jetpack_Sitemap_Buffer_Video_XMLWriter', $buffer );
	}

	/**
	 * Test creating a news buffer with XMLWriter.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_create_news_buffer_xmlwriter() {
		$buffer = Jetpack_Sitemap_Buffer_Factory::create( 'news', 2, 1000 );
		$this->assertInstanceOf( 'Jetpack_Sitemap_Buffer_News_XMLWriter', $buffer );
	}

	/**
	 * Test creating a master buffer with XMLWriter.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_create_master_buffer_xmlwriter() {
		$buffer = Jetpack_Sitemap_Buffer_Factory::create( 'master', 2, 1000 );
		$this->assertInstanceOf( 'Jetpack_Sitemap_Buffer_Master_XMLWriter', $buffer );
	}

	/**
	 * Test creating a buffer with an invalid type.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_create_invalid_type() {
		$buffer = Jetpack_Sitemap_Buffer_Factory::create( 'invalid', 2, 1000 );
		$this->assertNull( $buffer );
	}

	/**
	 * Test creating a buffer with a custom timestamp.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_create_buffer_with_timestamp() {
		$time   = '2024-01-01 00:00:00';
		$buffer = Jetpack_Sitemap_Buffer_Factory::create( 'page', 2, 1000, $time );
		$this->assertInstanceOf( 'Jetpack_Sitemap_Buffer_Page_XMLWriter', $buffer );
		// We can't test the timestamp directly as it's private, but at least we ensure it doesn't break
	}

	/**
	 * Test fallback when XMLWriter is not available.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_create_buffer_without_xmlwriter() {
		// Mock XMLWriter being unavailable
		if ( ! function_exists( 'runkit_function_rename' ) ) {
			$this->markTestSkipped( 'runkit extension required.' );
		}

		runkit_function_rename( 'class_exists', 'class_exists_backup' );
		runkit_function_add(
			'class_exists',
			'$class_name',
			'if ($class_name === "XMLWriter") return false; return class_exists_backup($class_name);'
		);

		$buffer = Jetpack_Sitemap_Buffer_Factory::create( 'page', 2, 1000 );
		$this->assertInstanceOf( 'Jetpack_Sitemap_Buffer_Page', $buffer );

		// Restore class_exists
		runkit_function_remove( 'class_exists' );
		runkit_function_rename( 'class_exists_backup', 'class_exists' );
	}

	/**
	 * Test fallback when both XMLWriter and DOMDocument are not available.
	 *
	 * @group jetpack-sitemap
	 */
	#[Group( 'jetpack-sitemap' )]
	public function test_create_buffer_without_xmlwriter_and_domdocument() {
		// Mock XMLWriter and DOMDocument being unavailable
		if ( ! function_exists( 'runkit_function_rename' ) ) {
			$this->markTestSkipped( 'runkit extension required.' );
		}

		runkit_function_rename( 'class_exists', 'class_exists_backup' );
		runkit_function_add(
			'class_exists',
			'$class_name',
			'if ($class_name === "XMLWriter" || $class_name === "DOMDocument") return false; return class_exists_backup($class_name);'
		);

		$buffer = Jetpack_Sitemap_Buffer_Factory::create( 'page', 2, 1000 );
		$this->assertInstanceOf( 'Jetpack_Sitemap_Buffer_Page', $buffer );

		// Restore class_exists
		runkit_function_remove( 'class_exists' );
		runkit_function_rename( 'class_exists_backup', 'class_exists' );
	}

	/** @dataProvider styled_buffers */
	#[DataProvider( 'styled_buffers' )]
	public function test_every_buffer_references_css( $class ) {
		$buffer = new $class( 10, 4096, '2026-11-20 12:00:00' );
		$xml    = $buffer->contents();
		$doc    = new DOMDocument();
		$this->assertTrue( $doc->loadXML( $xml ) );
		$instructions = ( new DOMXPath( $doc ) )->query( '/processing-instruction("xml-stylesheet")' );
		$this->assertSame( 2, $instructions->length );
		$static = preg_replace( '/^https?:/', '', add_query_arg( 'ver', md5_file( JETPACK__PLUGIN_DIR . 'modules/sitemaps/sitemap.css' ), plugins_url( 'modules/sitemaps/sitemap.css', JETPACK__PLUGIN_DIR . 'jetpack.php' ) ) );
		$labels = preg_replace( '/^https?:/', '', home_url( '/?jetpack-sitemap=sitemap-labels.css' ) );
		$this->assertSame( 'type="text/css" href="' . esc_xml( $static ) . '"', $instructions->item( 0 )->data );
		$this->assertSame( 'type="text/css" href="' . esc_xml( $labels ) . '"', $instructions->item( 1 )->data );
		$this->assertStringNotContainsString( 'text/xsl', $xml );
	}

	public static function styled_buffers() {
		$cases = array();
		foreach ( array( 'Page', 'Master', 'Image', 'Video', 'News' ) as $type ) {
			foreach ( array( '', '_XMLWriter' ) as $suffix ) {
				$class                    = 'Jetpack_Sitemap_Buffer_' . $type . $suffix;
				$cases[ $type . $suffix ] = array( $class );
			}
		}
		return $cases;
	}
}
