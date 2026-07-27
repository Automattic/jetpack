<?php
/**
 * Copies AI provenance XMP between images.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Copies common JPEG APP1 and PNG iTXt XMP containers.
 */
final class XMP_Copier {

	const MAX_XMP_BYTES = 4194304; // 4 MB.

	const JPEG_SOI           = "\xFF\xD8";
	const JPEG_APP1          = "\xFF\xE1";
	const JPEG_XMP_SIGNATURE = "http://ns.adobe.com/xap/1.0/\0";

	const PNG_SIGNATURE   = "\x89PNG\r\n\x1a\n";
	const PNG_XMP_KEYWORD = 'XML:com.adobe.xmp';

	/**
	 * Extract an AI-marked XMP container.
	 *
	 * @param string $source_path Original image path.
	 * @param string $mime        Image MIME type.
	 * @return string|null Container bytes, or null if unsupported, absent, too large, or not AI-marked.
	 */
	public static function extract( $source_path, $mime ) {
		$bytes = self::read( $source_path );
		if ( null === $bytes ) {
			return null;
		}

		if ( 'image/jpeg' === $mime ) {
			$xmp = self::extract_jpeg_xmp( $bytes );
		} elseif ( 'image/png' === $mime ) {
			$xmp = self::extract_png_xmp( $bytes );
		} else {
			return null;
		}

		if ( null === $xmp || strlen( $xmp ) > self::MAX_XMP_BYTES || ! self::has_ai_marker( $xmp ) ) {
			return null;
		}

		return $xmp;
	}

	/**
	 * Add an XMP container to an image that does not already carry an AI marker.
	 *
	 * @param string $target_path Derivative image path.
	 * @param string $xmp         Raw XMP container bytes.
	 * @param string $mime        Image MIME type.
	 * @return bool|null True if rewritten; false if a write was attempted but failed;
	 *                   null if there was nothing to do (unsupported or already marked).
	 */
	public static function inject( $target_path, $xmp, $mime ) {
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		if ( false === @getimagesize( $target_path ) ) {
			return null;
		}

		$bytes = self::read( $target_path );
		if ( null === $bytes || self::has_ai_marker( $bytes ) ) {
			return null;
		}

		if ( 'image/jpeg' === $mime ) {
			$updated = self::inject_jpeg_xmp( $bytes, $xmp );
		} elseif ( 'image/png' === $mime ) {
			$updated = self::inject_png_xmp( $bytes, $xmp );
		} else {
			return null;
		}

		if ( null === $updated ) {
			return null;
		}

		return self::replace( $target_path, $updated );
	}

	/**
	 * Read a file.
	 *
	 * @param string $path File path.
	 * @return string|null File bytes, or null on failure.
	 */
	private static function read( $path ) {
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents, WordPress.PHP.NoSilencedErrors.Discouraged
		$bytes = @file_get_contents( $path );
		return false === $bytes ? null : $bytes;
	}

	/**
	 * Extract the first standard JPEG XMP APP1 segment.
	 *
	 * @param string $bytes JPEG bytes.
	 * @return string|null
	 */
	private static function extract_jpeg_xmp( $bytes ) {
		if ( 0 !== strpos( $bytes, self::JPEG_SOI ) ) {
			return null;
		}

		$offset = 0;
		while ( true ) {
			$signature_pos = strpos( $bytes, self::JPEG_XMP_SIGNATURE, $offset );
			if ( false === $signature_pos ) {
				return null;
			}

			// APP1 marker (2) + length (2) precede the signature; length covers itself + data.
			$segment_start = $signature_pos - 4;
			if ( $segment_start >= 2 && self::JPEG_APP1 === substr( $bytes, $segment_start, 2 ) ) {
				$length = unpack( 'nvalue', substr( $bytes, $segment_start + 2, 2 ) );
				$end    = $segment_start + 2 + $length['value'];
				if ( $length['value'] >= strlen( self::JPEG_XMP_SIGNATURE ) + 2 && $end <= strlen( $bytes ) ) {
					return substr( $bytes, $segment_start, $end - $segment_start );
				}
			}

			$offset = $signature_pos + 1;
		}
	}

	/**
	 * Extract the first uncompressed PNG XMP iTXt chunk.
	 *
	 * @param string $bytes PNG bytes.
	 * @return string|null
	 */
	private static function extract_png_xmp( $bytes ) {
		if ( 0 !== strpos( $bytes, self::PNG_SIGNATURE ) ) {
			return null;
		}

		$needle = 'iTXt' . self::PNG_XMP_KEYWORD . "\0";
		$offset = 8;
		while ( true ) {
			$type_pos = strpos( $bytes, $needle, $offset );
			if ( false === $type_pos ) {
				return null;
			}

			// Length (4) precedes 'iTXt'; chunk = length + 12 framing. Require the
			// post-keyword compression flag to be 0 (uncompressed) so it copies verbatim.
			$chunk_start = $type_pos - 4;
			if ( $chunk_start >= 8 ) {
				$length           = unpack( 'Nvalue', substr( $bytes, $chunk_start, 4 ) );
				$compression_flag = $type_pos + 4 + strlen( self::PNG_XMP_KEYWORD ) + 1;
				$chunk_end        = $chunk_start + 12 + $length['value'];

				if ( $length['value'] >= strlen( self::PNG_XMP_KEYWORD ) + 5
					&& "\0" === substr( $bytes, $compression_flag, 1 )
					&& $chunk_end <= strlen( $bytes )
				) {
					return substr( $bytes, $chunk_start, $chunk_end - $chunk_start );
				}
			}

			$offset = $type_pos + 1;
		}
	}

	/**
	 * Add XMP after a leading JFIF APP0 segment or directly after SOI.
	 *
	 * @param string $bytes JPEG bytes.
	 * @param string $xmp   Raw APP1 segment.
	 * @return string|null
	 */
	private static function inject_jpeg_xmp( $bytes, $xmp ) {
		if ( 0 !== strpos( $bytes, self::JPEG_SOI ) || self::JPEG_APP1 !== substr( $xmp, 0, 2 ) ) {
			return null;
		}

		$insert_at = 2;
		if ( "\xFF\xE0" === substr( $bytes, 2, 2 ) && strlen( $bytes ) >= 6 ) {
			$length   = unpack( 'nvalue', substr( $bytes, 4, 2 ) );
			$app0_end = 4 + $length['value'];
			if ( $length['value'] >= 2 && $app0_end <= strlen( $bytes ) ) {
				$insert_at = $app0_end;
			}
		}

		return substr( $bytes, 0, $insert_at ) . $xmp . substr( $bytes, $insert_at );
	}

	/**
	 * Add XMP before the final PNG IEND chunk.
	 *
	 * @param string $bytes PNG bytes.
	 * @param string $xmp   Raw iTXt chunk.
	 * @return string|null
	 */
	private static function inject_png_xmp( $bytes, $xmp ) {
		if ( 0 !== strpos( $bytes, self::PNG_SIGNATURE ) || 'iTXt' !== substr( $xmp, 4, 4 ) || strlen( $bytes ) < 20 ) {
			return null;
		}

		$iend = strlen( $bytes ) - 12;
		if ( "\0\0\0\0IEND" !== substr( $bytes, $iend, 8 ) ) {
			return null;
		}

		return substr( $bytes, 0, $iend ) . $xmp . substr( $bytes, $iend );
	}

	/**
	 * Check for an AI DigitalSourceType marker.
	 *
	 * @param string $bytes Bytes to search.
	 * @return bool
	 */
	private static function has_ai_marker( $bytes ) {
		// Match the AI values when they follow the IPTC `digitalsourcetype/` URI path.
		return 1 === preg_match(
			'#digitalsourcetype/(?:trainedAlgorithmicMedia|compositeWithTrainedAlgorithmicMedia|compositeSynthetic)(?![A-Za-z])#i',
			$bytes
		);
	}

	/**
	 * Replace a file using a temporary file in the same directory.
	 *
	 * @param string $target_path Target file.
	 * @param string $bytes       Replacement bytes.
	 * @return bool
	 */
	private static function replace( $target_path, $bytes ) {
		$dir = dirname( $target_path );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_tempnam, WordPress.PHP.NoSilencedErrors.Discouraged
		$tmp = @tempnam( $dir, '.jetpack-xmp-' );

		// rename() is atomic only within one filesystem; reject tempnam()'s fallback
		// to the system temp dir (which happens when $dir is unwritable).
		if ( false === $tmp || dirname( $tmp ) !== $dir ) {
			if ( false !== $tmp ) {
				// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink, WordPress.PHP.NoSilencedErrors.Discouraged
				@unlink( $tmp );
			}
			return false;
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents, WordPress.PHP.NoSilencedErrors.Discouraged
		$written = @file_put_contents( $tmp, $bytes );

		// Swap in only a complete write that still decodes, so a bad splice can't replace a good file.
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		if ( strlen( $bytes ) === $written && false !== @getimagesize( $tmp ) ) {
			// tempnam() creates the temp at 0600; match the target's mode (masking off
			// fileperms()'s type/special bits), falling back to 0644 so a fileperms()
			// failure never ships an owner-only, web-server-unreadable file.
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			$permissions = @fileperms( $target_path );
			$mode        = false !== $permissions ? $permissions & 0777 : 0644;
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_chmod, WordPress.PHP.NoSilencedErrors.Discouraged
			@chmod( $tmp, $mode );

			// phpcs:ignore WordPress.WP.AlternativeFunctions.rename_rename, WordPress.PHP.NoSilencedErrors.Discouraged
			if ( @rename( $tmp, $target_path ) ) {
				return true;
			}
		}

		// phpcs:ignore WordPress.WP.AlternativeFunctions.unlink_unlink, WordPress.PHP.NoSilencedErrors.Discouraged
		@unlink( $tmp );
		return false;
	}
}
