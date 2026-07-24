<?php
/**
 * Tests for the metadata preservation orchestrator.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Image_Metadata\Metadata_Preserver;
use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/class-image-metadata-fixtures.php';
require_once __DIR__ . '/class-image-metadata-stream-probe.php';

/**
 * @covers \Automattic\Jetpack\Plugin\Image_Metadata\Metadata_Preserver
 */
#[CoversClass( Metadata_Preserver::class )]
class Image_Metadata_Preserver_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @var string Uploads directory for the current test.
	 */
	private $dir;

	public function set_up() {
		parent::set_up();

		// Match the upload path to the base directory used for attached files.
		update_option( 'uploads_use_yearmonth_folders', 0 );

		// Refresh the upload directory after changing the option.
		$uploads   = wp_upload_dir( null, true, true );
		$this->dir = trailingslashit( $uploads['path'] );
		wp_mkdir_p( $this->dir );
	}

	public function tear_down() {
		if ( in_array( 'provprobe', stream_get_wrappers(), true ) ) {
			stream_wrapper_unregister( 'provprobe' );
		}
		Image_Metadata_Stream_Probe::$opens = 0;

		parent::tear_down();
	}

	/**
	 * Create a PNG attachment with one bare derivative.
	 *
	 * @return array
	 */
	private function seed_png_attachment() {
		$original = $this->dir . 'example.png';
		$deriv    = $this->dir . 'example-150x150.png';
		file_put_contents( $original, Image_Metadata_Fixtures::png_with_provenance() );
		file_put_contents( $deriv, Image_Metadata_Fixtures::bare_png() );

		$attachment_id = self::factory()->attachment->create_object(
			array(
				'file'           => $original,
				'post_mime_type' => 'image/png',
			)
		);
		update_post_meta( $attachment_id, '_wp_attached_file', 'example.png' );

		$this->assertSame( $original, wp_get_original_image_path( $attachment_id ) );

		$metadata = array(
			'file'  => 'example.png',
			'sizes' => array(
				'thumbnail' => array( 'file' => 'example-150x150.png' ),
			),
		);
		return array( $attachment_id, $metadata );
	}

	/**
	 * Create a non-AI PNG attachment with one bare derivative.
	 *
	 * @return array
	 */
	private function seed_non_ai_png_attachment() {
		$original = $this->dir . 'photo.png';
		$deriv    = $this->dir . 'photo-150x150.png';
		file_put_contents( $original, Image_Metadata_Fixtures::png_with_non_ai_provenance() );
		file_put_contents( $deriv, Image_Metadata_Fixtures::bare_png() );

		$attachment_id = self::factory()->attachment->create_object(
			array(
				'file'           => $original,
				'post_mime_type' => 'image/png',
			)
		);
		update_post_meta( $attachment_id, '_wp_attached_file', 'photo.png' );
		$this->assertSame( $original, wp_get_original_image_path( $attachment_id ) );

		$this->assertStringContainsString( 'digitalCapture', file_get_contents( $original ) );

		$metadata = array(
			'file'  => 'photo.png',
			'sizes' => array(
				'thumbnail' => array( 'file' => 'photo-150x150.png' ),
			),
		);
		return array( $attachment_id, $metadata, $deriv );
	}

	public function test_skips_when_provenance_is_not_ai() {
		list( $id, $metadata, $deriv ) = $this->seed_non_ai_png_attachment();
		$bare                          = file_get_contents( $deriv );

		Metadata_Preserver::preserve( $metadata, $id );

		$this->assertSame( $bare, file_get_contents( $deriv ), 'a non-AI payload must leave the derivative untouched' );
	}

	public function test_ai_markers_filter_can_broaden_to_a_non_ai_value() {
		list( $id, $metadata, $deriv ) = $this->seed_non_ai_png_attachment();

		add_filter(
			'jetpack_preserve_image_provenance_ai_markers',
			function () {
				return array( 'digitalCapture' );
			}
		);

		Metadata_Preserver::preserve( $metadata, $id );

		$this->assertStringContainsString( 'digitalCapture', file_get_contents( $deriv ), 'a matching custom marker must let the payload through' );
	}

	public function test_empty_ai_markers_filter_preserves_all_provenance() {
		list( $id, $metadata, $deriv ) = $this->seed_non_ai_png_attachment();

		add_filter( 'jetpack_preserve_image_provenance_ai_markers', '__return_empty_array' );

		Metadata_Preserver::preserve( $metadata, $id );

		$this->assertStringContainsString( 'digitalCapture', file_get_contents( $deriv ), 'an empty marker list must fall back to preserving all provenance' );
	}

	public function test_injects_provenance_into_derivative() {
		list( $id, $metadata ) = $this->seed_png_attachment();
		$returned              = Metadata_Preserver::preserve( $metadata, $id );

		$this->assertSame( $metadata, $returned, 'metadata array must be returned unchanged' );
		$this->assertStringContainsString( 'trainedAlgorithmicMedia', file_get_contents( $this->dir . 'example-150x150.png' ) );
	}

	public function test_is_idempotent_no_second_injection() {
		list( $id, $metadata ) = $this->seed_png_attachment();
		Metadata_Preserver::preserve( $metadata, $id );
		$after_first = file_get_contents( $this->dir . 'example-150x150.png' );

		Metadata_Preserver::preserve( $metadata, $id );
		$after_second = file_get_contents( $this->dir . 'example-150x150.png' );

		$this->assertSame( $after_first, $after_second, 'a second run must be a no-op' );
		$this->assertSame( 1, substr_count( $after_second, 'trainedAlgorithmicMedia' ) );
	}

	public function test_filter_override_can_disable() {
		list( $id, $metadata ) = $this->seed_png_attachment();
		add_filter( 'jetpack_preserve_image_provenance_metadata', '__return_false' );

		Metadata_Preserver::preserve( $metadata, $id );
		$this->assertStringNotContainsString( 'trainedAlgorithmicMedia', file_get_contents( $this->dir . 'example-150x150.png' ) );
	}

	public function test_skips_when_photon_active() {
		list( $id, $metadata ) = $this->seed_png_attachment();

		// Restore the Image CDN state after the assertion.
		$prop = new ReflectionProperty( '\Automattic\Jetpack\Image_CDN\Image_CDN', 'is_enabled' );
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true ); // Required before PHP 8.1.
		}
		$prop->setValue( null, true );
		try {
			Metadata_Preserver::preserve( $metadata, $id );
			$this->assertStringNotContainsString( 'trainedAlgorithmicMedia', file_get_contents( $this->dir . 'example-150x150.png' ) );
		} finally {
			$prop->setValue( null, false );
		}
	}

	public function test_skips_stream_wrapper_original() {
		list( $id, $metadata ) = $this->seed_png_attachment();

		if ( in_array( 'provprobe', stream_get_wrappers(), true ) ) {
			stream_wrapper_unregister( 'provprobe' );
		}
		Image_Metadata_Stream_Probe::$opens = 0;
		stream_wrapper_register( 'provprobe', 'Image_Metadata_Stream_Probe' );

		add_filter(
			'wp_get_original_image_path',
			function () {
				return 'provprobe://vfs/example.png';
			}
		);

		// Confirm WordPress recognizes the test wrapper.
		$this->assertTrue( wp_is_stream( 'provprobe://vfs/example.png' ) );

		// Suppress the expected debug warning.
		set_error_handler( '__return_true' );
		try {
			$this->assertSame( $metadata, Metadata_Preserver::preserve( $metadata, $id ) );
		} finally {
			restore_error_handler();
		}

		// Zero opens proves the stream check ran before extraction.
		$this->assertSame( 0, Image_Metadata_Stream_Probe::$opens, 'gate 3 must skip before extract() opens the original' );

		$this->assertStringNotContainsString( 'trainedAlgorithmicMedia', file_get_contents( $this->dir . 'example-150x150.png' ) );
	}

	public function test_injects_into_scaled_main_derivative() {
		list( $id ) = $this->seed_png_attachment();

		// Simulate WordPress's main scaled derivative.
		$scaled = $this->dir . 'example-scaled.png';
		file_put_contents( $scaled, Image_Metadata_Fixtures::bare_png() );

		$metadata = array(
			'file'  => 'example-scaled.png',
			'sizes' => array(),
		);
		Metadata_Preserver::preserve( $metadata, $id );

		$this->assertStringContainsString( 'trainedAlgorithmicMedia', file_get_contents( $scaled ) );
	}

	public function test_skips_when_payload_exceeds_cap() {
		$original = $this->dir . 'oversized.png';
		$deriv    = $this->dir . 'oversized-150x150.png';

		// Keep the AI marker while padding the payload past the limit.
		$oversized_xmp   = 'XML:com.adobe.xmp' . "\0\0\0\0\0" . Image_Metadata_Fixtures::xmp_packet() . str_repeat( 'x', Metadata_Preserver::DEFAULT_MAX_PAYLOAD_BYTES + 1024 );
		$oversized_chunk = Image_Metadata_Fixtures::png_chunk( 'iTXt', $oversized_xmp );

		$bare            = Image_Metadata_Fixtures::bare_png();
		$iend_length_pos = strpos( $bare, 'IEND' ) - 4;
		$oversized_png   = substr( $bare, 0, $iend_length_pos ) . $oversized_chunk . substr( $bare, $iend_length_pos );

		file_put_contents( $original, $oversized_png );
		file_put_contents( $deriv, $bare );

		$id = self::factory()->attachment->create_object(
			array(
				'file'           => $original,
				'post_mime_type' => 'image/png',
			)
		);
		update_post_meta( $id, '_wp_attached_file', 'oversized.png' );
		$this->assertSame( $original, wp_get_original_image_path( $id ) );

		$metadata = array(
			'file'  => 'oversized.png',
			'sizes' => array( 'thumbnail' => array( 'file' => 'oversized-150x150.png' ) ),
		);

		// Capture the expected warning without failing the test.
		$caught = null;
		set_error_handler(
			function ( $errno, $errstr ) use ( &$caught ) {
				$caught = $errstr;
				return true;
			},
			E_USER_WARNING
		);
		try {
			Metadata_Preserver::preserve( $metadata, $id );
		} finally {
			restore_error_handler();
		}

		$this->assertNotNull( $caught, 'expected a warning when the payload exceeds the cap' );
		$this->assertStringContainsString( 'exceeds cap', $caught );

		$this->assertSame( $bare, file_get_contents( $deriv ), 'derivative must be untouched when the payload exceeds the cap' );
	}

	public function test_cap_filter_can_raise_limit() {
		$original = $this->dir . 'uncapped.png';
		$deriv    = $this->dir . 'uncapped-150x150.png';

		// Keep the AI marker while padding the payload past the default limit.
		$oversized_xmp   = 'XML:com.adobe.xmp' . "\0\0\0\0\0" . Image_Metadata_Fixtures::xmp_packet()
			. str_repeat( 'x', Metadata_Preserver::DEFAULT_MAX_PAYLOAD_BYTES + 1024 );
		$oversized_chunk = Image_Metadata_Fixtures::png_chunk( 'iTXt', $oversized_xmp );

		$bare            = Image_Metadata_Fixtures::bare_png();
		$iend_length_pos = strpos( $bare, 'IEND' ) - 4;
		$oversized_png   = substr( $bare, 0, $iend_length_pos ) . $oversized_chunk . substr( $bare, $iend_length_pos );

		file_put_contents( $original, $oversized_png );
		file_put_contents( $deriv, $bare );

		$id = self::factory()->attachment->create_object(
			array(
				'file'           => $original,
				'post_mime_type' => 'image/png',
			)
		);
		update_post_meta( $id, '_wp_attached_file', 'uncapped.png' );
		$this->assertSame( $original, wp_get_original_image_path( $id ) );

		$metadata = array(
			'file'  => 'uncapped.png',
			'sizes' => array( 'thumbnail' => array( 'file' => 'uncapped-150x150.png' ) ),
		);

		add_filter( 'jetpack_preserve_image_provenance_max_bytes', '__return_zero' );
		Metadata_Preserver::preserve( $metadata, $id );

		$this->assertStringContainsString( 'trainedAlgorithmicMedia', file_get_contents( $deriv ) );
	}

	public function test_corrupt_original_leaves_derivative_intact() {
		$original = $this->dir . 'broken.png';
		$deriv    = $this->dir . 'broken-150x150.png';
		file_put_contents( $original, "\x89PNG\r\n\x1a\ngarbage-not-a-real-png" );
		$bare = Image_Metadata_Fixtures::bare_png();
		file_put_contents( $deriv, $bare );

		$id = self::factory()->attachment->create_object(
			array(
				'file'           => $original,
				'post_mime_type' => 'image/png',
			)
		);
		update_post_meta( $id, '_wp_attached_file', 'broken.png' );

		$metadata = array(
			'file'  => 'broken.png',
			'sizes' => array( 'thumbnail' => array( 'file' => 'broken-150x150.png' ) ),
		);
		Metadata_Preserver::preserve( $metadata, $id );

		$this->assertSame( $bare, file_get_contents( $deriv ), 'derivative must be untouched' );
	}

	public function test_warn_fires_action_hook_even_without_wp_debug() {
		list( $id, $metadata ) = $this->seed_png_attachment();

		if ( in_array( 'provprobe', stream_get_wrappers(), true ) ) {
			stream_wrapper_unregister( 'provprobe' );
		}
		Image_Metadata_Stream_Probe::$opens = 0;
		stream_wrapper_register( 'provprobe', 'Image_Metadata_Stream_Probe' );

		add_filter(
			'wp_get_original_image_path',
			function () {
				return 'provprobe://vfs/example.png';
			}
		);

		$caught_message = null;
		$callback       = function ( $message ) use ( &$caught_message ) {
			$caught_message = $message;
		};
		add_action( 'jetpack_preserve_image_provenance_failed', $callback );

		// Suppress the expected debug warning.
		set_error_handler( '__return_true' );
		try {
			Metadata_Preserver::preserve( $metadata, $id );
		} finally {
			restore_error_handler();
			remove_action( 'jetpack_preserve_image_provenance_failed', $callback );
		}

		$this->assertNotNull( $caught_message, 'expected the observability action to fire even though WP_DEBUG gates trigger_error()' );
		$this->assertNotEmpty( $caught_message );
	}
}
