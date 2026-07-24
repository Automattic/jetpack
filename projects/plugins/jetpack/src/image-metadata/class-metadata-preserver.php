<?php
/**
 * Orchestrates AI-provenance metadata preservation across image derivatives.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Copies AI provenance from an original image to local derivatives.
 */
final class Metadata_Preserver {

	/**
	 * Maximum payload size copied to each derivative by default.
	 *
	 * @var int
	 */
	const DEFAULT_MAX_PAYLOAD_BYTES = 4194304; // 4 MB.

	/**
	 * Preserve provenance while returning attachment metadata unchanged.
	 *
	 * @param mixed $metadata      Attachment metadata array.
	 * @param int   $attachment_id Attachment post ID.
	 * @return mixed The metadata, unchanged.
	 */
	public static function preserve( $metadata, $attachment_id ) {
		try {
			if ( is_array( $metadata ) ) {
				$instance = new self();
				$instance->run( $metadata, (int) $attachment_id );
			}
		} catch ( \Throwable $e ) {
			self::warn( sprintf( 'unexpected error for attachment %d: %s', (int) $attachment_id, $e->getMessage() ) );
		}
		return $metadata;
	}

	/**
	 * Copy provenance into eligible derivatives.
	 *
	 * @param array $metadata      Attachment metadata.
	 * @param int   $attachment_id Attachment post ID.
	 * @return void
	 */
	private function run( array $metadata, $attachment_id ) {
		if ( empty( $metadata['file'] ) ) {
			return;
		}

		$mime = (string) get_post_mime_type( $attachment_id );

		// Photon serves its own derivatives, so local copies do not need rewriting.
		if ( $this->is_photon_active() ) {
			return;
		}

		$should = apply_filters( 'jetpack_preserve_image_provenance_metadata', true, $attachment_id, $mime );
		if ( ! $should ) {
			return;
		}

		// Use the untouched original; atomic replacement requires local files.
		$original = wp_get_original_image_path( $attachment_id );
		if ( ! $original || wp_is_stream( $original ) ) {
			self::warn( sprintf( 'skipping attachment %d: original missing or on a stream wrapper', $attachment_id ) );
			return;
		}

		$transplanter = $this->transplanter_for( $mime );
		if ( null === $transplanter ) {
			return;
		}

		$payload = $transplanter->extract( $original );
		if ( null === $payload || $payload->is_empty() ) {
			return;
		}

		// Leave ordinary XMP/IPTC, such as copyright and GPS, untouched.
		if ( ! $this->payload_has_ai_provenance( $payload, $attachment_id, $mime ) ) {
			return;
		}

		// A copied payload multiplies across every derivative.
		$total = 0;
		foreach ( $payload->get_segments() as $segment ) {
			$total += strlen( $segment );
		}
		$max = (int) apply_filters( 'jetpack_preserve_image_provenance_max_bytes', self::DEFAULT_MAX_PAYLOAD_BYTES, $attachment_id, $mime );
		if ( $max > 0 && $total > $max ) {
			self::warn( sprintf( 'skipping attachment %d: provenance payload %d bytes exceeds cap %d', $attachment_id, $total, $max ) );
			return;
		}

		$dir = trailingslashit( dirname( $original ) );
		foreach ( $this->output_files( $metadata, $original ) as $file ) {
			$this->preserve_one( $dir . $file, $file, $payload, $transplanter, $mime, $original, $attachment_id );
		}
	}

	/**
	 * Check for an AI DigitalSourceType marker with a best-effort byte scan.
	 *
	 * @param Payload $payload       Extracted provenance segments.
	 * @param int     $attachment_id Attachment post ID.
	 * @param string  $mime          Source MIME type.
	 * @return bool True when a marker is found or the marker list is empty.
	 */
	private function payload_has_ai_provenance( Payload $payload, $attachment_id, $mime ) {
		/**
		 * Filters AI DigitalSourceType markers.
		 *
		 * Return an empty array to preserve all provenance payloads.
		 *
		 * @param string[] $markers       AI DigitalSourceType tokens to match.
		 * @param int      $attachment_id Attachment post ID.
		 * @param string   $mime          Source MIME type.
		 */
		$markers = (array) apply_filters(
			'jetpack_preserve_image_provenance_ai_markers',
			array(
				'trainedAlgorithmicMedia',
				'compositeWithTrainedAlgorithmicMedia',
				'compositeSynthetic',
			),
			$attachment_id,
			$mime
		);

		if ( array() === $markers ) {
			return true;
		}

		$haystack = implode( '', $payload->get_segments() );
		foreach ( $markers as $marker ) {
			$marker = (string) $marker;
			if ( '' !== $marker && false !== stripos( $haystack, $marker ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Copy provenance into one derivative when needed.
	 *
	 * @param string                $path          Absolute derivative path.
	 * @param string                $file          Derivative basename.
	 * @param Payload               $payload       Extracted provenance.
	 * @param Abstract_Transplanter $transplanter  Source transplanter.
	 * @param string                $source_mime   Source MIME type.
	 * @param string                $original      Absolute original path.
	 * @param int                   $attachment_id Attachment post ID.
	 * @return void
	 */
	private function preserve_one( $path, $file, Payload $payload, Abstract_Transplanter $transplanter, $source_mime, $original, $attachment_id ) {
		if ( $path === $original || ! file_exists( $path ) ) {
			return;
		}
		if ( wp_is_stream( $path ) ) {
			self::warn( sprintf( 'skipping derivative %s for attachment %d: stream wrapper', $file, $attachment_id ) );
			return;
		}

		// Verify the bytes because a derivative's extension may not match its format.
		if ( wp_get_image_mime( $path ) !== $source_mime ) {
			return;
		}

		if ( $transplanter->has_payload( $path ) ) {
			return;
		}

		if ( ! $transplanter->inject( $path, $payload ) ) {
			self::warn( sprintf( 'injection failed for %s (attachment %d)', $file, $attachment_id ) );
		}
	}

	/**
	 * Get derivative basenames, including a main scaled or rotated file.
	 *
	 * @param array  $metadata Attachment metadata.
	 * @param string $original Absolute original path.
	 * @return string[] Unique basenames.
	 */
	private function output_files( array $metadata, $original ) {
		$files         = array();
		$original_base = wp_basename( $original );

		if ( ! empty( $metadata['file'] ) ) {
			$main_base = wp_basename( $metadata['file'] );
			if ( $main_base !== $original_base ) {
				$files[] = $main_base;
			}
		}

		if ( ! empty( $metadata['sizes'] ) && is_array( $metadata['sizes'] ) ) {
			foreach ( $metadata['sizes'] as $size ) {
				if ( ! empty( $size['file'] ) ) {
					$files[] = wp_basename( $size['file'] );
				}
			}
		}

		return array_values( array_unique( $files ) );
	}

	/**
	 * Select a transplanter for a supported MIME type.
	 *
	 * @param string $mime MIME type such as `image/png`.
	 * @return Abstract_Transplanter|null
	 */
	private function transplanter_for( $mime ) {
		switch ( $mime ) {
			case 'image/png':
				return new PNG_Transplanter();
			case 'image/jpeg':
				return new JPEG_Transplanter();
			default:
				return null;
		}
	}

	/**
	 * Whether Jetpack's Image CDN (Photon) is active this request.
	 *
	 * @return bool
	 */
	private function is_photon_active() {
		return class_exists( '\Automattic\Jetpack\Image_CDN\Image_CDN', false )
			&& \Automattic\Jetpack\Image_CDN\Image_CDN::is_enabled();
	}

	/**
	 * Report a skip or failure without breaking an upload.
	 *
	 * @param string $message Human-readable reason.
	 * @return void
	 */
	private static function warn( $message ) {
		/**
		 * Fires when image provenance preservation skips or fails.
		 *
		 * @param string $message Human-readable reason for the skip/failure.
		 */
		try {
			do_action( 'jetpack_preserve_image_provenance_failed', $message );
		} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- Reporting must not break uploads.
			// Ignore subscriber failures.
		}

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			try {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_trigger_error
				trigger_error( 'Jetpack Image Metadata: ' . esc_html( $message ), E_USER_WARNING );
			} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- Reporting must not break uploads.
				// Ignore error-handler failures.
			}
		}
	}
}
