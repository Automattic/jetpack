<?php
/**
 * Tests for the HEIF to JPEG upload conversion.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\RequiresFunction;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/media/ai-marker-image-editor.php';
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/media/heif-support.php';
require_once __DIR__ . '/fixtures/class-photon-opencv.php';
require_once __DIR__ . '/trait-fake-ai-marker-tools.php';

/**
 * Runs the conversion with a fake Photon_OpenCV and fake exiftool.
 *
 * @requires function imagejpeg
 */
#[RequiresFunction( 'imagejpeg' )]
class Heif_Support_Test extends \WorDBless\BaseTestCase {
	use Fake_AI_Marker_Tools;

	const AI_MARKER = 'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia';

	/**
	 * Values the conversion sent to jetpack_bump_stats_extras for the AI marker.
	 *
	 * @var string[]
	 */
	private $stats = array();

	/**
	 * Keeps real tools out of the tests.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'jetpack_wpcom_ai_marker_tool_path', '__return_empty_string' );
		add_action(
			'jetpack_bump_stats_extras',
			function ( $name, $value ) {
				if ( 'heif2jpg_ai_marker' === $name ) {
					$this->stats[] = $value;
				}
			},
			10,
			2
		);
	}

	public function test_copies_the_heic_type_into_the_jpeg() {
		$this->fake_exiftool( self::AI_MARKER );
		$heic              = $this->heic();
		$read_before_write = null;
		add_action(
			'jetpack_test_photon_opencv_before_write',
			function () use ( &$read_before_write ) {
				$read_before_write = $this->read_paths();
			}
		);

		$this->assertTrue( jetpack_wpcom_maybe_convert_heif_to_jpg( $heic ) );

		$this->assertSame( array( $heic ), $read_before_write );
		$this->assertSame(
			array(
				array( '-config', '', '-m', '-S', '-XMP-iptcExt:DigitalSourceType', '-JUMBF:JUMDLabel', $heic ),
				array( '-config', '', '-m', '-q', '-overwrite_original', '-XMP-x:XMPToolkit=', self::$write_arg . self::AI_MARKER, $heic ),
			),
			$this->calls( 'exiftool' )
		);
		$this->assertSame( array( 'written' ), $this->stats );
	}

	public function test_writes_nothing_when_the_heic_has_no_type() {
		$this->fake_exiftool( '' );

		$this->assertTrue( jetpack_wpcom_maybe_convert_heif_to_jpg( $this->heic() ) );

		$this->assertCount( 1, $this->calls( 'exiftool' ) );
		$this->assertSame( array(), $this->stats );
	}

	/**
	 * Hosts where the type cannot be copied, and the stats that should result.
	 *
	 * @return array
	 */
	public static function data_no_copy() {
		return array(
			'no exiftool'           => array( null, array() ),
			'exiftool cannot write' => array( 1, array( 'write-failed' ) ),
		);
	}

	/**
	 * @dataProvider data_no_copy
	 *
	 * @param int|null $write_status Exit status of a fake exiftool write, or null for no exiftool.
	 * @param string[] $stats        The stats that should result.
	 */
	#[DataProvider( 'data_no_copy' )]
	public function test_converts_when_the_type_cannot_be_copied( $write_status, $stats ) {
		if ( null !== $write_status ) {
			$this->fake_exiftool( self::AI_MARKER, $write_status );
		}
		$heic = $this->heic();

		$this->assertTrue( jetpack_wpcom_maybe_convert_heif_to_jpg( $heic ) );

		$this->assertSame( 'image/jpeg', getimagesize( $heic )['mime'] );
		$this->assertSame( $stats, $this->stats );
	}

	/**
	 * Returns the path of a file with a HEIC header.
	 *
	 * @return string
	 */
	private function heic() {
		$path = $this->temp_path( 'heic' );
		file_put_contents( $path, "\0\0\0\x18ftypheic\0\0\0\0mif1heic" );

		return $path;
	}
}
