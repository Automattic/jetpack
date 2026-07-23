<?php
/**
 * Orchestrates AI-provenance metadata preservation across image derivatives.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Runs on `wp_generate_attachment_metadata`: gates on Photon-off + local files,
 * extracts provenance once from the true original, and transplants it into each
 * derivative that is missing it.
 */
final class Metadata_Preserver {

	/**
	 * Default cap, in bytes, on the total size of a provenance payload (the sum
	 * of every extracted chunk/segment). Bounds disk/memory amplification, since
	 * the payload is copied verbatim into every derivative; XMP/IPTC provenance
	 * is far smaller than this (C2PA manifests are out of scope in v1).
	 *
	 * @var int
	 */
	const DEFAULT_MAX_PAYLOAD_BYTES = 4194304; // 4 MB.

	/**
	 * WordPress filter callback. Always returns `$metadata` unchanged — only file
	 * bytes are rewritten. Wrapped so a failure never breaks an upload.
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
	 * Run the gates and, if all pass, transplant provenance into every output
	 * derivative that is missing it.
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

		// Gate 1 — Photon off. When the Image CDN serves derivatives, preserving
		// WordPress's own is wasted work (and WPCOM strips metadata anyway).
		if ( $this->is_photon_active() ) {
			return;
		}

		// Gate 2 — filterable override (default on).
		$should = apply_filters( 'jetpack_preserve_image_provenance_metadata', true, $attachment_id, $mime );
		if ( ! $should ) {
			return;
		}

		// Gate 3 — local filesystem (rename() is unreliable across stream wrappers).
		// Read the true original, not the possibly-stripped -scaled/-rotated file.
		$original = wp_get_original_image_path( $attachment_id );
		if ( ! $original || wp_is_stream( $original ) ) {
			self::warn( sprintf( 'skipping attachment %d: original missing or on a stream wrapper', $attachment_id ) );
			return;
		}

		$transplanter = $this->transplanter_for( $mime );
		if ( null === $transplanter ) {
			return; // Unsupported source format (v1: PNG + JPEG only).
		}

		// Gate 4 — extract the provenance once, reused for every derivative.
		$payload = $transplanter->extract( $original );
		if ( null === $payload || $payload->is_empty() ) {
			return; // No provenance to copy — the "image lacks it" case, deferred.
		}

		// Gate 5 — cap the payload size. It's copied into every derivative, so an
		// oversized one multiplies across all sizes; skip the whole attachment
		// rather than injecting a partial set.
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
			$this->preserve_one( $dir . $file, $file, $payload, $original, $attachment_id );
		}
	}

	/**
	 * Transplant into a single derivative, honouring the idempotent skip.
	 *
	 * @param string  $path          Absolute derivative path.
	 * @param string  $file          Derivative basename (for logging).
	 * @param Payload $payload       Extracted provenance.
	 * @param string  $original      Absolute original path (never rewritten).
	 * @param int     $attachment_id Attachment post ID (for logging).
	 * @return void
	 */
	private function preserve_one( $path, $file, Payload $payload, $original, $attachment_id ) {
		if ( $path === $original || ! file_exists( $path ) ) {
			return; // Never touch the original; skip missing sizes.
		}
		if ( wp_is_stream( $path ) ) {
			self::warn( sprintf( 'skipping derivative %s for attachment %d: stream wrapper', $file, $attachment_id ) );
			return;
		}

		$check        = wp_check_filetype( $path );
		$deriv_mime   = isset( $check['type'] ) ? $check['type'] : false;
		$transplanter = $deriv_mime ? $this->transplanter_for( $deriv_mime ) : null;

		// A derivative can differ from the source format; only copy when the
		// derivative's transplanter handles the payload's source format.
		if ( null === $transplanter || ! $transplanter->supports( $payload->get_format() ) ) {
			return;
		}

		if ( $transplanter->has_payload( $path ) ) {
			return; // Idempotent no-op (the Imagick-JPEG case).
		}

		if ( ! $transplanter->inject( $path, $payload ) ) {
			self::warn( sprintf( 'injection failed for %s (attachment %d)', $file, $attachment_id ) );
		}
	}

	/**
	 * All derivative basenames to process: every registered size plus the main
	 * full-size derivative (`-scaled`/`-rotated`/converted) when it differs from
	 * the original.
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
	 * Select the transplanter for a MIME type, or null when unsupported (v1: PNG + JPEG only).
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
	 * Record a skip or failure without ever breaking an upload. The action fires
	 * on every site so monitoring can see drops; `trigger_error()` stays gated on
	 * WP_DEBUG, as there is no general-purpose Jetpack logger.
	 *
	 * @param string $message Human-readable reason.
	 * @return void
	 */
	private static function warn( $message ) {
		/**
		 * Fires when provenance preservation skips or fails for an image, so a site
		 * can observe drops (e.g. logging/monitoring) even when WP_DEBUG is off.
		 *
		 * @param string $message Human-readable reason for the skip/failure.
		 */
		try {
			do_action( 'jetpack_preserve_image_provenance_failed', $message );
		} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- observability must never break an upload.
			// A subscriber throwing must not escape.
		}

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			try {
				// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_trigger_error
				trigger_error( 'Jetpack Image Metadata: ' . esc_html( $message ), E_USER_WARNING );
			} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- never let logging break an upload.
				// A custom error handler on a strict dev/staging host may convert
				// E_USER_WARNING into an exception; it must not escape this method.
			}
		}
	}
}
