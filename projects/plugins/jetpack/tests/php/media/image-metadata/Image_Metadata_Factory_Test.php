<?php
/**
 * Tests for the transplanter factory.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Image_Metadata\JPEG_Transplanter;
use Automattic\Jetpack\Plugin\Image_Metadata\PNG_Transplanter;
use Automattic\Jetpack\Plugin\Image_Metadata\Transplanter_Factory;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Automattic\Jetpack\Plugin\Image_Metadata\Transplanter_Factory
 */
#[CoversClass( Transplanter_Factory::class )]
class Image_Metadata_Factory_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public function test_returns_png_transplanter_for_png() {
		$this->assertInstanceOf( PNG_Transplanter::class, ( new Transplanter_Factory() )->for_mime( 'image/png' ) );
	}

	public function test_returns_jpeg_transplanter_for_jpeg() {
		$this->assertInstanceOf( JPEG_Transplanter::class, ( new Transplanter_Factory() )->for_mime( 'image/jpeg' ) );
	}

	public function test_returns_null_for_unsupported() {
		$factory = new Transplanter_Factory();
		$this->assertNull( $factory->for_mime( 'image/webp' ) );
		$this->assertNull( $factory->for_mime( 'image/gif' ) );
		$this->assertNull( $factory->for_mime( '' ) );
	}
}
