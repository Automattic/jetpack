<?php

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * @covers Jetpack_Sitemap_Buffer_Fallback
 */
#[CoversClass( Jetpack_Sitemap_Buffer_Fallback::class )]
class Jetpack_Sitemap_Buffer_Fallback_Test extends WP_UnitTestCase {

	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @dataProvider fallback_types
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @param string $type Sitemap type.
	 */
	#[DataProvider( 'fallback_types' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_fallback_buffer_references_css( $type ) {
		$directory = JETPACK__PLUGIN_DIR . 'modules/sitemaps/';
		require_once $directory . 'sitemap-buffer.php';
		require_once $directory . 'sitemap-finder.php';
		require_once $directory . 'sitemap-buffer-fallback.php';
		require_once $directory . 'sitemap-buffer-' . $type . '-fallback.php';

		$class  = 'Jetpack_Sitemap_Buffer_' . ucfirst( $type );
		$buffer = new $class( 10, 4096, '2026-11-20 12:00:00' );
		$xml    = new DOMDocument();
		$this->assertTrue( $xml->loadXML( $buffer->contents() ) );
		$instructions = ( new DOMXPath( $xml ) )->query( '/processing-instruction("xml-stylesheet")' );
		$this->assertSame( 2, $instructions->length );
		$this->assertMatchesRegularExpression( '~^type="text/css" href="[^"]+/sitemap\.css\?ver=[a-f0-9]{32}"$~', $instructions->item( 0 )->nodeValue );
		$this->assertStringContainsString( 'type="text/css"', $instructions->item( 1 )->nodeValue );
		$this->assertStringContainsString( '?jetpack-sitemap=sitemap-labels.css', $instructions->item( 1 )->nodeValue );
	}

	/**
	 * @return array
	 */
	public static function fallback_types() {
		return array(
			'master' => array( 'master' ),
			'page'   => array( 'page' ),
			'image'  => array( 'image' ),
			'video'  => array( 'video' ),
			'news'   => array( 'news' ),
		);
	}
}
