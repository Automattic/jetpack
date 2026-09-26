<?php
/**
 * Preserves AI provenance XMP in image sizes.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Copies XMP from original images into local derivatives.
 */
final class Image_Metadata {

	/**
	 * Register after other derivative filters.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter(
			'wp_generate_attachment_metadata',
			array( self::class, 'preserve' ),
			PHP_INT_MAX,
			2
		);
	}

	/**
	 * Copy AI-marked XMP into generated image sizes.
	 *
	 * @param mixed $metadata      Attachment metadata.
	 * @param int   $attachment_id Attachment post ID.
	 * @return mixed Unchanged attachment metadata.
	 */
	public static function preserve( $metadata, $attachment_id ) {
		if ( ! is_array( $metadata ) || empty( $metadata['file'] ) || self::is_photon_active() || self::is_wpcom_platform() ) {
			return $metadata;
		}

		/**
		 * Filters whether to preserve AI-provenance XMP in generated image sizes.
		 *
		 * Return false to disable the feature.
		 *
		 * @param bool $enabled       Whether to run. Default true.
		 * @param int  $attachment_id Attachment post ID.
		 */
		if ( ! apply_filters( 'jetpack_preserve_image_provenance', true, (int) $attachment_id ) ) {
			return $metadata;
		}

		try {
			self::preserve_files( $metadata, (int) $attachment_id );
		} catch ( \Throwable $error ) {
			self::warn( sprintf( 'unexpected error for attachment %d: %s', (int) $attachment_id, $error->getMessage() ) );
		}

		return $metadata;
	}

	/**
	 * Copy XMP into each local derivative.
	 *
	 * @param array $metadata      Attachment metadata.
	 * @param int   $attachment_id Attachment post ID.
	 * @return void
	 */
	private static function preserve_files( array $metadata, $attachment_id ) {
		$mime = (string) get_post_mime_type( $attachment_id );
		if ( 'image/jpeg' !== $mime && 'image/png' !== $mime ) {
			return;
		}

		$original = wp_get_original_image_path( $attachment_id );
		if ( ! $original || wp_is_stream( $original ) ) {
			return;
		}

		$source_type = XMP_Copier::extract( $original, $mime );
		if ( null === $source_type ) {
			return;
		}

		$original_name = wp_basename( $original );
		$files         = array();
		$main_file     = wp_basename( $metadata['file'] );
		if ( $main_file !== $original_name ) {
			$files[] = $main_file;
		}

		if ( ! empty( $metadata['sizes'] ) && is_array( $metadata['sizes'] ) ) {
			foreach ( $metadata['sizes'] as $size ) {
				if ( ! empty( $size['file'] ) ) {
					$files[] = wp_basename( $size['file'] );
				}
			}
		}

		$dir = trailingslashit( dirname( $original ) );
		foreach ( array_unique( $files ) as $file ) {
			$target = $dir . $file;
			if ( $target !== $original && file_exists( $target ) && ! wp_is_stream( $target ) ) {
				// false means a write was attempted and failed; null means nothing to do.
				if ( false === XMP_Copier::inject( $target, $source_type, $mime ) ) {
					self::warn( sprintf( 'could not write XMP into %s for attachment %d', $file, $attachment_id ) );
				}
			}
		}
	}

	/**
	 * Record a failure so a site can observe drops, without ever breaking an upload.
	 *
	 * @param string $message Human-readable reason.
	 * @return void
	 */
	private static function warn( $message ) {
		try {
			/**
			 * Fires when AI-provenance XMP preservation fails for an image.
			 *
			 * @param string $message Human-readable reason for the failure.
			 */
			do_action( 'jetpack_preserve_image_provenance_failed', $message );
		} catch ( \Throwable $error ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- A subscriber must not break the upload.
			// Swallowed intentionally.
		}
	}

	/**
	 * Check whether Jetpack's Image CDN is active.
	 *
	 * @return bool
	 */
	private static function is_photon_active() {
		return class_exists( '\Automattic\Jetpack\Image_CDN\Image_CDN', false )
			&& \Automattic\Jetpack\Image_CDN\Image_CDN::is_enabled();
	}

	/**
	 * Check whether the site runs on the WordPress.com platform (Simple or WoA),
	 * where image sizes and their metadata are handled by the platform.
	 *
	 * @return bool
	 */
	private static function is_wpcom_platform() {
		return ( new \Automattic\Jetpack\Status\Host() )->is_wpcom_platform();
	}
}
