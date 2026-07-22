<?php
/**
 * Shared behaviour for concrete transplanters.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Provides the atomic, validated, permission-preserving write shared by every
 * format's transplanter. Concrete subclasses copy provenance-bearing container
 * chunks/segments verbatim between two files of the same image format, without
 * parsing or understanding their contents.
 */
abstract class Abstract_Transplanter {

	/**
	 * Check whether this transplanter handles a given MIME type.
	 *
	 * @param string $mime A MIME type such as `image/png`.
	 * @return bool True when this transplanter handles that format.
	 */
	abstract public function supports( $mime );

	/**
	 * Read the provenance segments from a source file.
	 *
	 * @param string $source_path Absolute path to the source image.
	 * @return Payload|null Payload (possibly empty) on a readable file of this
	 *                      format, or null when the file cannot be read/parsed.
	 */
	abstract public function extract( $source_path );

	/**
	 * Check whether a derivative already carries provenance segments.
	 *
	 * @param string $target_path Absolute path to a candidate derivative.
	 * @return bool True when the derivative already carries provenance segments.
	 */
	abstract public function has_payload( $target_path );

	/**
	 * Build the new file bytes with the payload spliced in at the correct
	 * format-specific position.
	 *
	 * @param string  $bytes   Current bytes of the target file.
	 * @param Payload $payload Segments to insert.
	 * @return string|null New bytes, or null when the target cannot be parsed.
	 */
	abstract protected function build_injected_bytes( $bytes, Payload $payload );

	/**
	 * Read a file, normalising a read failure to null.
	 *
	 * @param string $path Absolute path.
	 * @return string|null
	 */
	protected function read( $path ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents, WordPress.PHP.NoSilencedErrors.Discouraged
		$bytes = @file_get_contents( $path );
		return false === $bytes ? null : $bytes;
	}

	/**
	 * Inject the payload atomically, keeping WordPress's file unless the rewrite
	 * both still decodes and demonstrably carries the payload.
	 *
	 * @param string  $target_path Absolute path to the derivative to rewrite.
	 * @param Payload $payload     Segments to transplant.
	 * @return bool
	 */
	public function inject( $target_path, Payload $payload ) {
		if ( $payload->is_empty() ) {
			return false;
		}

		$bytes = $this->read( $target_path );
		if ( null === $bytes ) {
			return false;
		}

		$injected = $this->build_injected_bytes( $bytes, $payload );
		if ( null === $injected ) {
			return false;
		}

		// A unique, same-directory temp file: same filesystem guarantees an
		// atomic rename, and the unique suffix avoids collisions with concurrent
		// regeneration of the same attachment.
		$tmp = $target_path . '.' . uniqid( 'jpprov', true ) . '.tmp';
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents, WordPress.PHP.NoSilencedErrors.Discouraged
		if ( false === @file_put_contents( $tmp, $injected ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink, WordPress.PHP.NoSilencedErrors.Discouraged
			@unlink( $tmp );
			return false;
		}

		// Two cheap, independent checks: the result still decodes, and it
		// actually carries the payload (getimagesize alone never inspects metadata).
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		if ( false === @getimagesize( $tmp ) || ! $this->has_payload( $tmp ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink, WordPress.PHP.NoSilencedErrors.Discouraged
			@unlink( $tmp );
			return false;
		}

		// Preserve WordPress's file mode. Without this, rename() leaves the temp
		// file's umask-derived permissions, which on a restrictive-umask host can
		// be unreadable to the web server (broken images).
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		$perms = @fileperms( $target_path );
		if ( false !== $perms ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_chmod, WordPress.PHP.NoSilencedErrors.Discouraged
			@chmod( $tmp, $perms & 0777 );
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.rename_rename, WordPress.PHP.NoSilencedErrors.Discouraged
		if ( ! @rename( $tmp, $target_path ) ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink, WordPress.PHP.NoSilencedErrors.Discouraged
			@unlink( $tmp );
			return false;
		}

		return true;
	}
}
