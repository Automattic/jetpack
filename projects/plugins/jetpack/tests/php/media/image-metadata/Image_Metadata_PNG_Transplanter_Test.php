<?php
/**
 * Tests for the PNG transplanter.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Image_Metadata\Payload;
use Automattic\Jetpack\Plugin\Image_Metadata\PNG_Transplanter;
use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/class-image-metadata-fixtures.php';

/**
 * @covers \Automattic\Jetpack\Plugin\Image_Metadata\PNG_Transplanter
 * @covers \Automattic\Jetpack\Plugin\Image_Metadata\Abstract_Transplanter
 */
#[CoversClass( PNG_Transplanter::class )]
#[CoversClass( Automattic\Jetpack\Plugin\Image_Metadata\Abstract_Transplanter::class )]
class Image_Metadata_PNG_Transplanter_Test extends WP_UnitTestCase {
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
		$path = tempnam( get_temp_dir(), 'imgmeta' ) . '.png';
		file_put_contents( $path, $bytes );
		$this->temp_files[] = $path;
		return $path;
	}

	public function test_supports_only_png() {
		$transplanter = new PNG_Transplanter();
		$this->assertTrue( $transplanter->supports( 'image/png' ) );
		$this->assertFalse( $transplanter->supports( 'image/jpeg' ) );
	}

	public function test_extract_returns_xmp_but_not_exif() {
		$payload = ( new PNG_Transplanter() )->extract( $this->temp_file( Image_Metadata_Fixtures::png_with_provenance() ) );

		$this->assertNotNull( $payload );
		$this->assertFalse( $payload->is_empty() );
		$joined = implode( '', $payload->get_segments() );
		$this->assertStringContainsString( 'trainedAlgorithmicMedia', $joined );
		$this->assertStringNotContainsString( Image_Metadata_Fixtures::EXIF_MARKER, $joined );
	}

	public function test_has_payload_reports_presence_and_absence() {
		$transplanter = new PNG_Transplanter();
		$this->assertFalse( $transplanter->has_payload( $this->temp_file( Image_Metadata_Fixtures::bare_png() ) ) );
		$this->assertTrue( $transplanter->has_payload( $this->temp_file( Image_Metadata_Fixtures::png_with_provenance() ) ) );
	}

	public function test_inject_transplants_provenance_and_result_still_decodes() {
		$transplanter = new PNG_Transplanter();
		$payload      = $transplanter->extract( $this->temp_file( Image_Metadata_Fixtures::png_with_provenance() ) );

		$target = $this->temp_file( Image_Metadata_Fixtures::bare_png() );
		$this->assertTrue( $transplanter->inject( $target, $payload ) );

		$this->assertNotFalse( getimagesize( $target ) );
		$result = file_get_contents( $target );
		$this->assertStringContainsString( 'trainedAlgorithmicMedia', $result );
		$this->assertStringNotContainsString( Image_Metadata_Fixtures::EXIF_MARKER, $result );
		$this->assertTrue( $transplanter->has_payload( $target ) );
	}

	public function test_inject_preserves_file_permissions() {
		$transplanter = new PNG_Transplanter();
		$payload      = $transplanter->extract( $this->temp_file( Image_Metadata_Fixtures::png_with_provenance() ) );

		$target = $this->temp_file( Image_Metadata_Fixtures::bare_png() );
		chmod( $target, 0644 );
		$transplanter->inject( $target, $payload );

		clearstatcache();
		$this->assertSame( 0644, fileperms( $target ) & 0777 );
	}

	public function test_inject_returns_false_for_empty_payload() {
		$target = $this->temp_file( Image_Metadata_Fixtures::bare_png() );
		$this->assertFalse( ( new PNG_Transplanter() )->inject( $target, new Payload( 'image/png', array() ) ) );
	}

	public function test_extract_returns_null_for_non_png() {
		$this->assertNull( ( new PNG_Transplanter() )->extract( $this->temp_file( 'not a png' ) ) );
	}
}
