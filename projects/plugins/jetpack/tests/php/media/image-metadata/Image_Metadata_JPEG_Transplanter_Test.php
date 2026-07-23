<?php
/**
 * Tests for the JPEG transplanter.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Image_Metadata\JPEG_Transplanter;
use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/class-image-metadata-fixtures.php';

/**
 * @covers \Automattic\Jetpack\Plugin\Image_Metadata\JPEG_Transplanter
 * @covers \Automattic\Jetpack\Plugin\Image_Metadata\Abstract_Transplanter
 */
#[CoversClass( JPEG_Transplanter::class )]
#[CoversClass( Automattic\Jetpack\Plugin\Image_Metadata\Abstract_Transplanter::class )]
class Image_Metadata_JPEG_Transplanter_Test extends WP_UnitTestCase {
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
		$this->temp_files = array();
		parent::tear_down();
	}

	private function temp_file( $bytes ) {
		$path = tempnam( get_temp_dir(), 'imgmeta' ) . '.jpg';
		file_put_contents( $path, $bytes );
		$this->temp_files[] = $path;
		return $path;
	}

	public function test_supports_only_jpeg() {
		$transplanter = new JPEG_Transplanter();
		$this->assertTrue( $transplanter->supports( 'image/jpeg' ) );
		$this->assertFalse( $transplanter->supports( 'image/png' ) );
	}

	public function test_extract_returns_xmp_and_iptc_but_not_exif() {
		$payload = ( new JPEG_Transplanter() )->extract( $this->temp_file( Image_Metadata_Fixtures::jpeg_with_provenance() ) );

		$this->assertNotNull( $payload );
		$this->assertFalse( $payload->is_empty() );
		$joined = implode( '', $payload->get_segments() );
		$this->assertStringContainsString( 'ns.adobe.com/xap/1.0/', $joined );
		$this->assertStringContainsString( 'Photoshop 3.0', $joined );
		$this->assertStringNotContainsString( Image_Metadata_Fixtures::EXIF_MARKER, $joined );
	}

	public function test_has_payload_reports_presence_and_absence() {
		$transplanter = new JPEG_Transplanter();
		$this->assertFalse( $transplanter->has_payload( $this->temp_file( Image_Metadata_Fixtures::bare_jpeg() ) ) );
		$this->assertTrue( $transplanter->has_payload( $this->temp_file( Image_Metadata_Fixtures::jpeg_with_provenance() ) ) );
	}

	public function test_inject_transplants_provenance_and_result_still_decodes() {
		$transplanter = new JPEG_Transplanter();
		$payload      = $transplanter->extract( $this->temp_file( Image_Metadata_Fixtures::jpeg_with_provenance() ) );

		$target = $this->temp_file( Image_Metadata_Fixtures::bare_jpeg() );
		$this->assertTrue( $transplanter->inject( $target, $payload ) );

		$this->assertNotFalse( getimagesize( $target ) );
		$result = file_get_contents( $target );
		$this->assertStringContainsString( 'trainedAlgorithmicMedia', $result );
		$this->assertStringNotContainsString( Image_Metadata_Fixtures::EXIF_MARKER, $result );
		$this->assertTrue( $transplanter->has_payload( $target ) );
	}

	public function test_injected_segments_land_after_leading_app0() {
		$transplanter = new JPEG_Transplanter();
		$payload      = $transplanter->extract( $this->temp_file( Image_Metadata_Fixtures::jpeg_with_provenance() ) );
		$target       = $this->temp_file( Image_Metadata_Fixtures::bare_jpeg() );
		$transplanter->inject( $target, $payload );

		// APP0 (FFE0) must remain the first marker after SOI.
		$this->assertSame( "\xFF\xD8\xFF\xE0", substr( file_get_contents( $target ), 0, 4 ) );
	}

	public function test_walk_segments_skips_fill_bytes_before_a_marker() {
		// Splice an extra `0xFF` fill byte before a provenance APP1 (XMP) segment.
		// Without skipping fill bytes, walk_segments() would stop early and miss it.
		$jpeg      = Image_Metadata_Fixtures::bare_jpeg();
		$insert_at = Image_Metadata_Fixtures::after_leading_app0( $jpeg );

		$app1_xmp = Image_Metadata_Fixtures::jpeg_segment( 0xE1, "http://ns.adobe.com/xap/1.0/\0" . Image_Metadata_Fixtures::xmp_packet() );

		$with_fill_byte = substr( $jpeg, 0, $insert_at ) . "\xFF" . $app1_xmp . substr( $jpeg, $insert_at );

		$path         = $this->temp_file( $with_fill_byte );
		$transplanter = new JPEG_Transplanter();

		$this->assertTrue( $transplanter->has_payload( $path ) );

		$payload = $transplanter->extract( $path );
		$this->assertNotNull( $payload );
		$this->assertFalse( $payload->is_empty() );
		$this->assertStringContainsString( 'trainedAlgorithmicMedia', implode( '', $payload->get_segments() ) );
	}
}
