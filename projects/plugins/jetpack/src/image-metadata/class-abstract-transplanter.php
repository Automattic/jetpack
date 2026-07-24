<?php
/**
 * Shared behaviour for concrete transplanters.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Provides guarded file replacement shared by format transplanters.
 */
abstract class Abstract_Transplanter {

	/**
	 * Read the provenance segments from a source file.
	 *
	 * @param string $source_path Absolute path to the source image.
	 * @return Payload|null Payload on success, or null when the file cannot be parsed.
	 */
	abstract public function extract( $source_path );

	/**
	 * Check whether a derivative already carries provenance segments.
	 *
	 * @param string $target_path Absolute path to a candidate derivative.
	 * @return bool
	 */
	abstract public function has_payload( $target_path );

	/**
	 * Add the payload at the format-specific position.
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
	 * Inject the payload without replacing the target with an unrecognized image.
	 *
	 * @param string  $target_path Absolute path to the derivative to rewrite.
	 * @param Payload $payload     Segments to transplant.
	 * @return bool True when the file was rewritten; false when nothing changed.
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

		return $this->atomically_replace( $target_path, $injected );
	}

	/**
	 * Replace $target_path with $bytes atomically.
	 *
	 * @param string $target_path Absolute path to the derivative.
	 * @param string $bytes       Complete replacement bytes.
	 * @return bool
	 */
	private function atomically_replace( $target_path, $bytes ) {
		$tmp = $this->write_temp( $target_path, $bytes );
		if ( null === $tmp ) {
			return false;
		}

		if ( ! $this->is_valid_payload_carrier( $tmp ) ) {
			$this->discard( $tmp );
			return false;
		}

		$this->match_permissions( $target_path, $tmp );

		if ( ! $this->swap_into_place( $tmp, $target_path ) ) {
			$this->discard( $tmp );
			return false;
		}

		return true;
	}

	/**
	 * Write bytes to a unique temporary file beside the derivative.
	 *
	 * @param string $target_path Absolute path to the derivative.
	 * @param string $bytes       Bytes to write.
	 * @return string|null
	 */
	private function write_temp( $target_path, $bytes ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_tempnam, WordPress.PHP.NoSilencedErrors.Discouraged
		$tmp = @tempnam( dirname( $target_path ), '.jetpack-provenance-' );

		// tempnam() may fall back to another directory, where rename() is not atomic.
		if ( false === $tmp || dirname( $tmp ) !== dirname( $target_path ) ) {
			if ( false !== $tmp ) {
				$this->discard( $tmp );
			}
			return null;
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents, WordPress.PHP.NoSilencedErrors.Discouraged
		if ( false === @file_put_contents( $tmp, $bytes ) ) {
			$this->discard( $tmp );
			return null;
		}
		return $tmp;
	}

	/**
	 * Whether the rewritten file has a recognizable image header and payload.
	 *
	 * The getimagesize() check covers the header, not whether every pixel decodes.
	 *
	 * @param string $path Absolute path to the candidate file.
	 * @return bool
	 */
	private function is_valid_payload_carrier( $path ) {
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		return false !== @getimagesize( $path ) && $this->has_payload( $path );
	}

	/**
	 * Match permissions so the renamed file remains readable.
	 *
	 * @param string $target_path File whose permissions to copy.
	 * @param string $tmp         Temporary file to adjust.
	 * @return void
	 */
	private function match_permissions( $target_path, $tmp ) {
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		$perms = @fileperms( $target_path );
		if ( false !== $perms ) {
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_chmod, WordPress.PHP.NoSilencedErrors.Discouraged
			@chmod( $tmp, $perms & 0777 );
		}
	}

	/**
	 * Move the temporary file onto the derivative.
	 *
	 * @param string $tmp         Temporary file.
	 * @param string $target_path Destination path.
	 * @return bool
	 */
	private function swap_into_place( $tmp, $target_path ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.rename_rename, WordPress.PHP.NoSilencedErrors.Discouraged
		return @rename( $tmp, $target_path );
	}

	/**
	 * Delete a temporary file.
	 *
	 * @param string $tmp Temporary file path.
	 * @return void
	 */
	private function discard( $tmp ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink, WordPress.PHP.NoSilencedErrors.Discouraged
		@unlink( $tmp );
	}
}
