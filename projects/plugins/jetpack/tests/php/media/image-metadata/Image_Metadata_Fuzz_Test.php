<?php
/**
 * Deterministic fuzz tests for image metadata transplanters.
 *
 * Failed injections must leave targets unchanged. Successful files must remain
 * recognizable and carry the payload. Read paths must tolerate malformed input.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Image_Metadata\Abstract_Transplanter;
use Automattic\Jetpack\Plugin\Image_Metadata\JPEG_Transplanter;
use Automattic\Jetpack\Plugin\Image_Metadata\Payload;
use Automattic\Jetpack\Plugin\Image_Metadata\PNG_Transplanter;
use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/class-image-metadata-fixtures.php';

/**
 * @covers \Automattic\Jetpack\Plugin\Image_Metadata\JPEG_Transplanter
 * @covers \Automattic\Jetpack\Plugin\Image_Metadata\PNG_Transplanter
 * @covers \Automattic\Jetpack\Plugin\Image_Metadata\Abstract_Transplanter
 */
#[CoversClass( JPEG_Transplanter::class )]
#[CoversClass( PNG_Transplanter::class )]
#[CoversClass( Abstract_Transplanter::class )]
class Image_Metadata_Fuzz_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Mutations per format and population.
	 *
	 * @var int
	 */
	const ITERATIONS = 500;

	/**
	 * Temp files to remove after the test.
	 *
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

	/**
	 * Reserve a reusable temporary path.
	 *
	 * @param string $ext File extension, including the leading dot.
	 * @return string
	 */
	private function reserve_path( $ext ) {
		$path               = tempnam( get_temp_dir(), 'imgfuzz' ) . $ext;
		$this->temp_files[] = $path;
		return $path;
	}

	/**
	 * Mutate bytes while optionally preserving the format signature.
	 *
	 * @param string $bytes    Bytes to corrupt.
	 * @param int    $seed     Reproducible seed (base salt ^ iteration index).
	 * @param int    $preserve Number of leading bytes to leave untouched.
	 * @return string Corrupted bytes.
	 */
	private function mutate( $bytes, $seed, $preserve ) {
		$prefix = substr( $bytes, 0, $preserve );
		$body   = (string) substr( $bytes, $preserve );

		mt_srand( $seed );
		$len = strlen( $body );

		switch ( mt_rand( 0, 4 ) ) {
			case 0: // Truncate.
				$body = substr( $body, 0, mt_rand( 0, $len ) );
				break;

			case 1: // Flip random bytes.
				for ( $i = 0, $flips = mt_rand( 1, 8 ); $i < $flips && $len > 0; $i++ ) {
					$pos          = mt_rand( 0, $len - 1 );
					$body[ $pos ] = chr( ord( $body[ $pos ] ) ^ mt_rand( 1, 255 ) );
				}
				break;

			case 2: // Overwrite a short run.
				if ( $len > 0 ) {
					$start = mt_rand( 0, $len - 1 );
					$run   = mt_rand( 1, min( 8, $len - $start ) );
					$body  = substr( $body, 0, $start ) . str_repeat( chr( mt_rand( 0, 255 ) ), $run ) . substr( $body, $start + $run );
				}
				break;

			case 3: // Insert a short run.
				$start = mt_rand( 0, $len );
				$body  = substr( $body, 0, $start ) . str_repeat( chr( mt_rand( 0, 255 ) ), mt_rand( 1, 16 ) ) . substr( $body, $start );
				break;

			case 4: // Delete a short run.
				if ( $len > 1 ) {
					$start = mt_rand( 0, $len - 1 );
					$run   = mt_rand( 1, min( 16, $len - $start ) );
					$body  = substr( $body, 0, $start ) . substr( $body, $start + $run );
				}
				break;
		}

		return $prefix . $body;
	}

	/**
	 * Check injection against corrupted inputs.
	 *
	 * @param Abstract_Transplanter $transplanter Transplanter under test.
	 * @param string                $valid_target A clean, metadata-free derivative to corrupt.
	 * @param Payload               $payload      A valid, non-empty payload to inject.
	 * @param int                   $sig_len      Format signature length.
	 * @param string                $ext          Temp-file extension.
	 * @return void
	 */
	private function assert_inject_invariant( Abstract_Transplanter $transplanter, $valid_target, Payload $payload, $sig_len, $ext ) {
		$path = $this->reserve_path( $ext );

		// Test mutations with and without a valid format signature.
		foreach ( array( 0, $sig_len ) as $preserve ) {
			for ( $i = 0; $i < self::ITERATIONS; $i++ ) {
				$seed    = ( ( $preserve + 1 ) * 1000003 ) ^ $i;
				$mutated = $this->mutate( $valid_target, $seed, $preserve );
				file_put_contents( $path, $mutated );

				$result = $transplanter->inject( $path, $payload );

				$this->assertIsBool( $result, "inject() returned a non-bool (seed $seed)" );
				if ( $result ) {
					// Match the production header check without exposing debug warnings.
					// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
					$this->assertNotFalse( @getimagesize( $path ), "inject() reported success but the result has no recognizable image header (seed $seed)" );
					$this->assertTrue( $transplanter->has_payload( $path ), "inject() reported success but the payload is absent (seed $seed)" );
				} else {
					$this->assertSame( $mutated, file_get_contents( $path ), "inject() failed but the target was modified (seed $seed)" );
				}
			}
		}
	}

	/**
	 * Check read paths against corrupted inputs.
	 *
	 * @param Abstract_Transplanter $transplanter Transplanter under test.
	 * @param string                $valid_source A clean provenance-bearing image to corrupt.
	 * @param int                   $sig_len      Format signature length.
	 * @param string                $ext          Temp-file extension.
	 * @return void
	 */
	private function assert_read_paths_tolerate_garbage( Abstract_Transplanter $transplanter, $valid_source, $sig_len, $ext ) {
		$path = $this->reserve_path( $ext );

		foreach ( array( 0, $sig_len ) as $preserve ) {
			for ( $i = 0; $i < self::ITERATIONS; $i++ ) {
				$seed    = ( ( $preserve + 7 ) * 2000003 ) ^ $i;
				$mutated = $this->mutate( $valid_source, $seed, $preserve );
				file_put_contents( $path, $mutated );

				$payload = $transplanter->extract( $path );
				$this->assertTrue( null === $payload || $payload instanceof Payload, "extract() returned an unexpected type (seed $seed)" );
				$this->assertIsBool( $transplanter->has_payload( $path ), "has_payload() returned a non-bool (seed $seed)" );
			}
		}
	}

	public function test_jpeg_inject_never_corrupts_the_target() {
		$transplanter = new JPEG_Transplanter();
		$payload      = $transplanter->extract( $this->write_fixture( Image_Metadata_Fixtures::jpeg_with_provenance(), '.jpg' ) );

		$this->assertInstanceOf( Payload::class, $payload );
		$this->assertFalse( $payload->is_empty() );

		$this->assert_inject_invariant( $transplanter, Image_Metadata_Fixtures::bare_jpeg(), $payload, 2, '.jpg' );
	}

	public function test_png_inject_never_corrupts_the_target() {
		$transplanter = new PNG_Transplanter();
		$payload      = $transplanter->extract( $this->write_fixture( Image_Metadata_Fixtures::png_with_provenance(), '.png' ) );

		$this->assertInstanceOf( Payload::class, $payload );
		$this->assertFalse( $payload->is_empty() );

		$this->assert_inject_invariant( $transplanter, Image_Metadata_Fixtures::bare_png(), $payload, 8, '.png' );
	}

	public function test_jpeg_read_paths_tolerate_garbage() {
		$this->assert_read_paths_tolerate_garbage( new JPEG_Transplanter(), Image_Metadata_Fixtures::jpeg_with_provenance(), 2, '.jpg' );
	}

	public function test_png_read_paths_tolerate_garbage() {
		$this->assert_read_paths_tolerate_garbage( new PNG_Transplanter(), Image_Metadata_Fixtures::png_with_provenance(), 8, '.png' );
	}

	/**
	 * Write a fixture to a temporary file.
	 *
	 * @param string $bytes Fixture bytes.
	 * @param string $ext   File extension, including the leading dot.
	 * @return string Absolute path.
	 */
	private function write_fixture( $bytes, $ext ) {
		$path = $this->reserve_path( $ext );
		file_put_contents( $path, $bytes );
		return $path;
	}
}
