<?php
/**
 * Tests for the XMP copier.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Image_Metadata\XMP_Copier;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once __DIR__ . '/class-image-metadata-fixtures.php';

/**
 * @covers \Automattic\Jetpack\Plugin\Image_Metadata\XMP_Copier
 */
#[CoversClass( XMP_Copier::class )]
class Image_Metadata_XMP_Copier_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @var string[]
	 */
	private $temp_files = array();

	public function tear_down() {
		foreach ( $this->temp_files as $file ) {
			if ( file_exists( $file ) ) {
				unlink( $file );
			}
		}
		parent::tear_down();
	}

	/**
	 * @return array<string,array{0:string,1:string,2:string,3:string}>
	 */
	public static function format_provider() {
		return array(
			'JPEG' => array( 'image/jpeg', '.jpg', 'jpeg_with_xmp', 'bare_jpeg' ),
			'PNG'  => array( 'image/png', '.png', 'png_with_xmp', 'bare_png' ),
		);
	}

	/**
	 * @param string $mime         MIME type.
	 * @param string $extension    File extension.
	 * @param string $with_xmp     Fixture method with XMP.
	 * @param string $without_xmp  Fixture method without XMP.
	 * @dataProvider format_provider
	 */
	#[DataProvider( 'format_provider' )]
	public function test_copies_ai_xmp_without_exif( $mime, $extension, $with_xmp, $without_xmp ) {
		$source = $this->temp_file(
			Image_Metadata_Fixtures::$with_xmp( Image_Metadata_Fixtures::xmp_packet(), true ),
			$extension
		);
		$xmp    = XMP_Copier::extract( $source, $mime );
		$target = $this->temp_file( Image_Metadata_Fixtures::$without_xmp(), $extension );

		$this->assertNotNull( $xmp );
		$this->assertStringNotContainsString( Image_Metadata_Fixtures::EXIF_MARKER, $xmp );
		$this->assertTrue( XMP_Copier::inject( $target, $xmp, $mime ) );
		$this->assertNotFalse( getimagesize( $target ) );
		$this->assertStringContainsString( 'trainedAlgorithmicMedia', file_get_contents( $target ) );
		$this->assertStringNotContainsString( Image_Metadata_Fixtures::EXIF_MARKER, file_get_contents( $target ) );
	}

	/**
	 * @param string $mime         MIME type.
	 * @param string $extension    File extension.
	 * @param string $with_xmp     Fixture method with XMP.
	 * @param string $without_xmp  Fixture method without XMP.
	 * @dataProvider format_provider
	 */
	#[DataProvider( 'format_provider' )]
	public function test_ignores_non_ai_xmp( $mime, $extension, $with_xmp, $without_xmp ) {
		unset( $without_xmp );
		$source = $this->temp_file(
			Image_Metadata_Fixtures::$with_xmp( Image_Metadata_Fixtures::xmp_packet( Image_Metadata_Fixtures::NON_AI_SOURCE_TYPE ) ),
			$extension
		);

		$this->assertNull( XMP_Copier::extract( $source, $mime ) );
	}

	/**
	 * A marker token elsewhere in the metadata (not as a DigitalSourceType value)
	 * must not be treated as AI provenance.
	 *
	 * @param string $mime         MIME type.
	 * @param string $extension    File extension.
	 * @param string $with_xmp     Fixture method with XMP.
	 * @param string $without_xmp  Fixture method without XMP.
	 * @dataProvider format_provider
	 */
	#[DataProvider( 'format_provider' )]
	public function test_ignores_marker_token_outside_digitalsourcetype( $mime, $extension, $with_xmp, $without_xmp ) {
		unset( $without_xmp );
		$xmp    = Image_Metadata_Fixtures::xmp_packet(
			Image_Metadata_Fixtures::NON_AI_SOURCE_TYPE,
			'<xmp:Label>trainedAlgorithmicMedia</xmp:Label>'
		);
		$source = $this->temp_file( Image_Metadata_Fixtures::$with_xmp( $xmp ), $extension );

		$this->assertNull( XMP_Copier::extract( $source, $mime ), 'a bare marker token outside the DigitalSourceType URI must not count as AI' );
	}

	/**
	 * The composite value must still be recognised now that matching is URI-anchored.
	 *
	 * @param string $mime         MIME type.
	 * @param string $extension    File extension.
	 * @param string $with_xmp     Fixture method with XMP.
	 * @param string $without_xmp  Fixture method without XMP.
	 * @dataProvider format_provider
	 */
	#[DataProvider( 'format_provider' )]
	public function test_detects_composite_with_trained_source_type( $mime, $extension, $with_xmp, $without_xmp ) {
		unset( $without_xmp );
		$xmp    = Image_Metadata_Fixtures::xmp_packet(
			'http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia'
		);
		$source = $this->temp_file( Image_Metadata_Fixtures::$with_xmp( $xmp ), $extension );

		$this->assertNotNull( XMP_Copier::extract( $source, $mime ), 'compositeWithTrainedAlgorithmicMedia must be recognised as AI' );
	}

	/**
	 * @param string $mime         MIME type.
	 * @param string $extension    File extension.
	 * @param string $with_xmp     Fixture method with XMP.
	 * @param string $without_xmp  Fixture method without XMP.
	 * @dataProvider format_provider
	 */
	#[DataProvider( 'format_provider' )]
	public function test_is_idempotent( $mime, $extension, $with_xmp, $without_xmp ) {
		$source = $this->temp_file( Image_Metadata_Fixtures::$with_xmp( Image_Metadata_Fixtures::xmp_packet() ), $extension );
		$xmp    = XMP_Copier::extract( $source, $mime );
		$target = $this->temp_file( Image_Metadata_Fixtures::$without_xmp(), $extension );

		$this->assertTrue( XMP_Copier::inject( $target, $xmp, $mime ) );
		// A second run is a no-op (the target already carries the marker), reported
		// as null ("nothing to do") rather than false ("a write was attempted and failed").
		$this->assertNull( XMP_Copier::inject( $target, $xmp, $mime ) );
		$this->assertSame( 1, substr_count( file_get_contents( $target ), 'trainedAlgorithmicMedia' ) );
	}

	/**
	 * @param string $mime         MIME type.
	 * @param string $extension    File extension.
	 * @param string $with_xmp     Fixture method with XMP.
	 * @param string $without_xmp  Fixture method without XMP.
	 * @dataProvider format_provider
	 */
	#[DataProvider( 'format_provider' )]
	public function test_leaves_malformed_target_unchanged( $mime, $extension, $with_xmp, $without_xmp ) {
		unset( $without_xmp );
		$source = $this->temp_file( Image_Metadata_Fixtures::$with_xmp( Image_Metadata_Fixtures::xmp_packet() ), $extension );
		$xmp    = XMP_Copier::extract( $source, $mime );
		$target = $this->temp_file( 'not an image', $extension );

		// A non-image target is nothing to do (null), and must be left untouched.
		$this->assertNull( XMP_Copier::inject( $target, $xmp, $mime ) );
		$this->assertSame( 'not an image', file_get_contents( $target ) );
	}

	/**
	 * @param string $mime         MIME type.
	 * @param string $extension    File extension.
	 * @param string $with_xmp     Fixture method with XMP.
	 * @param string $without_xmp  Fixture method without XMP.
	 * @dataProvider format_provider
	 */
	#[DataProvider( 'format_provider' )]
	public function test_inject_preserves_file_permissions( $mime, $extension, $with_xmp, $without_xmp ) {
		$source = $this->temp_file( Image_Metadata_Fixtures::$with_xmp( Image_Metadata_Fixtures::xmp_packet() ), $extension );
		$xmp    = XMP_Copier::extract( $source, $mime );
		$target = $this->temp_file( Image_Metadata_Fixtures::$without_xmp(), $extension );
		chmod( $target, 0644 );

		$this->assertTrue( XMP_Copier::inject( $target, $xmp, $mime ) );
		$this->assertSame( 0644, fileperms( $target ) & 0777, "the rewritten derivative must keep the target's mode, not tempnam()'s 0600" );
	}

	public function test_ignores_oversized_png_xmp() {
		$xmp    = Image_Metadata_Fixtures::xmp_packet(
			Image_Metadata_Fixtures::AI_SOURCE_TYPE,
			str_repeat( 'x', XMP_Copier::MAX_XMP_BYTES )
		);
		$source = $this->temp_file( Image_Metadata_Fixtures::png_with_xmp( $xmp ), '.png' );

		$this->assertNull( XMP_Copier::extract( $source, 'image/png' ) );
	}

	/**
	 * Write bytes to a temporary image file.
	 *
	 * @param string $bytes     File bytes.
	 * @param string $extension File extension.
	 * @return string
	 */
	private function temp_file( $bytes, $extension ) {
		$path               = tempnam( get_temp_dir(), 'xmp' ) . $extension;
		$this->temp_files[] = $path;
		file_put_contents( $path, $bytes );
		return $path;
	}
}
