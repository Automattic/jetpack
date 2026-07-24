<?php
/**
 * JPEG provenance transplanter.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Copies XMP and Photoshop/IPTC segments between JPEG files, excluding EXIF
 * containers.
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
		return new Payload( $segments );
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
	 * Insert segments after a leading JFIF APP0, or directly after SOI.
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
	 * Yield length-prefixed segments before SOS or EOI.
	 *
	 * Handles extra 0xFF fill bytes and stops at malformed or truncated data.
	 *
	 * @param string $bytes JPEG bytes.
	 * @return \Generator
	 */
	private function walk_segments( $bytes ) {
		$len = strlen( $bytes );
		$pos = 2; // Skip the 2-byte SOI.

		while ( $pos + 4 <= $len ) {
			if ( "\xFF" !== $bytes[ $pos ] ) {
				break;
			}

			// Skip marker fill bytes.
			$marker_pos = $pos + 1;
			while ( $marker_pos < $len && "\xFF" === $bytes[ $marker_pos ] ) {
				++$marker_pos;
			}
			if ( $marker_pos + 2 >= $len ) {
				break;
			}

			$marker = ord( $bytes[ $marker_pos ] );
			if ( self::SOS === $marker || self::EOI === $marker ) {
				break;
			}

			// The length includes its two bytes, but not the marker.
			$length_field_pos = $marker_pos + 1;
			$length           = unpack( 'n', substr( $bytes, $length_field_pos, 2 ) )[1];
			$segment_end      = $length_field_pos + $length;
			if ( $length < 2 || $segment_end > $len ) {
				break;
			}

			yield array(
				'marker' => $marker,
				'data'   => substr( $bytes, $length_field_pos + 2, $length - 2 ),
				'raw'    => substr( $bytes, $pos, $segment_end - $pos ),
				'pos'    => $pos,
			);

			$pos = $segment_end;
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
		return false; // Excludes EXIF APP1.
	}
}
