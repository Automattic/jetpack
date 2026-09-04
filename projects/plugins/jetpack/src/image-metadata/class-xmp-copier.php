<?php
/**
 * Writes AI-provenance XMP into image derivatives.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Detects an AI DigitalSourceType in an original image and writes a minimal XMP
 * packet carrying only that marker into JPEG (APP1) and PNG (iTXt) derivatives.
 * The original's other XMP (creator, location, prompt, history, …) is not copied.
 */
final class XMP_Copier {

	const JPEG_SOI           = "\xFF\xD8";
	const JPEG_APP1          = "\xFF\xE1";
	const JPEG_XMP_SIGNATURE = "http://ns.adobe.com/xap/1.0/\0";

	const PNG_SIGNATURE   = "\x89PNG\r\n\x1a\n";
	const PNG_XMP_KEYWORD = 'XML:com.adobe.xmp';

	/**
	 * IPTC "Digital Source Type" NewsCodes base URI.
	 */
	const DIGITAL_SOURCE_TYPE_BASE = 'http://cv.iptc.org/newscodes/digitalsourcetype/';

	/**
	 * Find the AI DigitalSourceType declared in a source image.
	 *
	 * @param string $source_path Original image path.
	 * @param string $mime        Image MIME type.
	 * @return string|null DigitalSourceType URI, or null if unsupported or not AI-marked.
	 */
	public static function extract( $source_path, $mime ) {
		if ( 'image/jpeg' !== $mime && 'image/png' !== $mime ) {
			return null;
		}

		$bytes = self::read( $source_path );
		if ( null === $bytes ) {
			return null;
		}

		return self::find_ai_source_type( $bytes );
	}

	/**
	 * Write a minimal XMP packet carrying only $source_type into a derivative that
	 * does not already declare an AI DigitalSourceType.
	 *
	 * @param string $target_path Derivative image path.
	 * @param string $source_type DigitalSourceType value; validated and canonicalized internally.
	 * @param string $mime        Image MIME type.
	 * @return bool|null True if rewritten; false if a write was attempted but failed;
	 *                   null if there was nothing to do (unsupported, unmarkable value, or already marked).
	 */
	public static function inject( $target_path, $source_type, $mime ) {
		// Canonicalize the value locally so the packet can only ever contain a known
		// IPTC URI, never caller-supplied text — inject() does not trust its input.
		$source_type = self::find_ai_source_type( $source_type );
		if ( null === $source_type ) {
			return null;
		}

		// A failed decode is expected, handled control flow (a non-image target), so
		// silence it; wp_getimagesize() would surface it as a warning under WP_DEBUG.
		// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
		if ( false === @getimagesize( $target_path ) ) {
			return null;
		}

		$bytes = self::read( $target_path );
		if ( null === $bytes || null !== self::find_ai_source_type( $bytes ) ) {
			return null;
		}

		$packet = self::xmp_packet( $source_type );

		if ( 'image/jpeg' === $mime ) {
			$updated = self::inject_jpeg_xmp( $bytes, $packet );
		} elseif ( 'image/png' === $mime ) {
			$updated = self::inject_png_xmp( $bytes, $packet );
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
	 * Build a minimal XMP packet carrying only the DigitalSourceType.
	 *
	 * @param string $source_type DigitalSourceType URI.
	 * @return string
	 */
	private static function xmp_packet( $source_type ) {
		// inject() canonicalizes $source_type through find_ai_source_type(), so it is
		// always a known IPTC URI and contains no characters needing escaping here.
		return '<?xpacket begin="' . "\xEF\xBB\xBF" . '" id="W5M0MpCehiHzreSzNTczkc9d"?>'
			. '<x:xmpmeta xmlns:x="adobe:ns:meta/">'
			. '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
			. '<rdf:Description rdf:about="" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" '
			. 'Iptc4xmpExt:DigitalSourceType="' . $source_type . '"/>'
			. '</rdf:RDF></x:xmpmeta>'
			. '<?xpacket end="w"?>';
	}

	/**
	 * Wrap an XMP packet in a JPEG APP1 segment and splice it after a leading JFIF
	 * APP0 (or directly after SOI).
	 *
	 * @param string $bytes  JPEG bytes.
	 * @param string $packet XMP packet.
	 * @return string|null
	 */
	private static function inject_jpeg_xmp( $bytes, $packet ) {
		if ( 0 !== strpos( $bytes, self::JPEG_SOI ) ) {
			return null;
		}

		$body = self::JPEG_XMP_SIGNATURE . $packet;
		if ( strlen( $body ) + 2 > 0xFFFF ) {
			return null; // APP1 length is a 16-bit field.
		}
		$segment = self::JPEG_APP1 . pack( 'n', strlen( $body ) + 2 ) . $body;

		// A leading JFIF APP0 must stay first; otherwise insert straight after SOI.
		$insert_at = 2;
		if ( "\xFF\xE0" === substr( $bytes, 2, 2 ) && strlen( $bytes ) >= 6 ) {
			$length   = unpack( 'nvalue', substr( $bytes, 4, 2 ) );
			$app0_end = 4 + $length['value'];
			if ( $length['value'] >= 2 && $app0_end <= strlen( $bytes ) ) {
				$insert_at = $app0_end;
			}
		}

		return substr( $bytes, 0, $insert_at ) . $segment . substr( $bytes, $insert_at );
	}

	/**
	 * Wrap an XMP packet in an uncompressed PNG iTXt chunk and splice it before the
	 * final IEND.
	 *
	 * @param string $bytes  PNG bytes.
	 * @param string $packet XMP packet.
	 * @return string|null
	 */
	private static function inject_png_xmp( $bytes, $packet ) {
		if ( 0 !== strpos( $bytes, self::PNG_SIGNATURE ) || strlen( $bytes ) < 20 ) {
			return null;
		}

		$iend = strlen( $bytes ) - 12;
		if ( "\0\0\0\0IEND" !== substr( $bytes, $iend, 8 ) ) {
			return null;
		}

		// iTXt: keyword \0 compression-flag(0) compression-method(0) language \0
		// translated-keyword \0 text.
		$data  = self::PNG_XMP_KEYWORD . "\0\0\0\0\0" . $packet;
		$chunk = pack( 'N', strlen( $data ) ) . 'iTXt' . $data . pack( 'N', crc32( 'iTXt' . $data ) );

		return substr( $bytes, 0, $iend ) . $chunk . substr( $bytes, $iend );
	}

	/**
	 * Find an AI DigitalSourceType value in image bytes.
	 *
	 * Matches only values under the IPTC `digitalsourcetype/` URI path, so a token
	 * elsewhere in the metadata can't false-match. Returns the canonical URI.
	 *
	 * @param string $bytes Bytes to search.
	 * @return string|null
	 */
	private static function find_ai_source_type( $bytes ) {
		if ( 1 === preg_match(
			'#digitalsourcetype/(trainedAlgorithmicMedia|compositeWithTrainedAlgorithmicMedia|compositeSynthetic)(?![A-Za-z])#i',
			$bytes,
			$matches
		) ) {
			return self::DIGITAL_SOURCE_TYPE_BASE . $matches[1];
		}
		return null;
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
