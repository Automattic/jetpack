<?php
/**
 * JPEG provenance transplanter.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Copies XMP (`APP1`) and Photoshop/IPTC (`APP13`) segments verbatim between
 * JPEG files. EXIF (`APP1` beginning `Exif\0\0`) is deliberately excluded.
 */
final class JPEG_Transplanter extends Abstract_Transplanter {

	const SOI   = "\xFF\xD8";
	const APP0  = 0xE0;
	const APP1  = 0xE1;
	const APP13 = 0xED;
	const SOS   = 0xDA;
	const EOI   = 0xD9;

	const XMP_SIGNATURE           = "http://ns.adobe.com/xap/1.0/\0";
	const XMP_EXTENSION_SIGNATURE = "http://ns.adobe.com/xmp/extension/\0";
	const PHOTOSHOP_SIGNATURE     = "Photoshop 3.0\0";

	/**
	 * Check whether this transplanter handles a given MIME type.
	 *
	 * @param string $mime MIME type.
	 * @return bool
	 */
	public function supports( $mime ) {
		return 'image/jpeg' === $mime;
	}

	/**
	 * Read the provenance segments from a source file.
	 *
	 * @param string $source_path Absolute path.
	 * @return Payload|null
	 */
	public function extract( $source_path ) {
		$bytes = $this->read( $source_path );
		if ( null === $bytes || 0 !== strpos( $bytes, self::SOI ) ) {
			return null;
		}
		$segments = array();
		foreach ( $this->walk_segments( $bytes ) as $segment ) {
			if ( $this->is_provenance_segment( $segment['marker'], $segment['data'] ) ) {
				$segments[] = $segment['raw'];
			}
		}
		return new Payload( 'image/jpeg', $segments );
	}

	/**
	 * Check whether a derivative already carries provenance segments.
	 *
	 * @param string $target_path Absolute path.
	 * @return bool
	 */
	public function has_payload( $target_path ) {
		$bytes = $this->read( $target_path );
		if ( null === $bytes || 0 !== strpos( $bytes, self::SOI ) ) {
			return false;
		}
		foreach ( $this->walk_segments( $bytes ) as $segment ) {
			if ( $this->is_provenance_segment( $segment['marker'], $segment['data'] ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Insert the provenance segments after any leading JFIF APP0 (which must stay
	 * first), otherwise directly after SOI.
	 *
	 * @param string  $bytes   Current JPEG bytes.
	 * @param Payload $payload Segments to insert.
	 * @return string|null
	 */
	protected function build_injected_bytes( $bytes, Payload $payload ) {
		if ( 0 !== strpos( $bytes, self::SOI ) ) {
			return null;
		}
		$insert_at = 2; // Just past SOI.
		foreach ( $this->walk_segments( $bytes ) as $segment ) {
			// Only the first segment can be a JFIF APP0, which must stay first.
			if ( self::APP0 === $segment['marker'] ) {
				$insert_at = $segment['pos'] + strlen( $segment['raw'] );
			}
			break;
		}
		return substr( $bytes, 0, $insert_at )
			. implode( '', $payload->get_segments() )
			. substr( $bytes, $insert_at );
	}

	/**
	 * Walk JPEG marker segments from just past SOI until SOS/EOI. Yields `marker`
	 * (int), `data` (payload minus the 2 length bytes), `raw` (full segment), and
	 * `pos` (offset of the 0xFF prefix). Stops on a malformed marker or a length
	 * field that overruns the buffer.
	 *
	 * @param string $bytes JPEG bytes.
	 * @return \Generator
	 */
	private function walk_segments( $bytes ) {
		$len = strlen( $bytes );
		$pos = 2; // Skip SOI.
		while ( $pos + 4 <= $len ) {
			if ( "\xFF" !== $bytes[ $pos ] ) {
				break; // Not at a marker — malformed or entropy-coded data.
			}
			$marker = ord( $bytes[ $pos + 1 ] );
			if ( self::SOS === $marker || self::EOI === $marker ) {
				break; // Scan data / end of image — no more parseable segments.
			}
			$seglen_field = unpack( 'n', substr( $bytes, $pos + 2, 2 ) );
			$seglen       = $seglen_field[1];
			if ( $seglen < 2 || $pos + 2 + $seglen > $len ) {
				break; // Corrupt: declared length is impossible or overruns.
			}
			$data = substr( $bytes, $pos + 4, $seglen - 2 );
			$raw  = substr( $bytes, $pos, 2 + $seglen );

			yield array(
				'marker' => $marker,
				'data'   => $data,
				'raw'    => $raw,
				'pos'    => $pos,
			);

			$pos += 2 + $seglen;
		}
	}

	/**
	 * Check whether a segment is a text segment carrying a provenance signature.
	 *
	 * @param int    $marker Segment marker byte.
	 * @param string $data   Segment payload.
	 * @return bool True for XMP APP1 (standard/extended) or Photoshop APP13.
	 */
	private function is_provenance_segment( $marker, $data ) {
		if ( self::APP1 === $marker ) {
			return 0 === strpos( $data, self::XMP_SIGNATURE )
				|| 0 === strpos( $data, self::XMP_EXTENSION_SIGNATURE );
		}
		if ( self::APP13 === $marker ) {
			return 0 === strpos( $data, self::PHOTOSHOP_SIGNATURE );
		}
		return false; // Notably excludes EXIF APP1 (`Exif\0\0`).
	}
}
