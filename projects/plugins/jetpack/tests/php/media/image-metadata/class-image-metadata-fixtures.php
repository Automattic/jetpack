<?php
/**
 * Image fixtures for XMP preservation tests.
 *
 * @package automattic/jetpack
 */

/**
 * Builds JPEG and PNG images with optional XMP.
 */
class Image_Metadata_Fixtures {

	const AI_SOURCE_TYPE     = 'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia';
	const NON_AI_SOURCE_TYPE = 'http://cv.iptc.org/newscodes/digitalsourcetype/digitalCapture';
	const EXIF_MARKER        = 'EXIF-MUST-NOT-BE-COPIED';

	/**
	 * Build a minimal XMP packet.
	 *
	 * @param string $source_type DigitalSourceType value.
	 * @param string $padding     Optional packet padding.
	 * @return string
	 */
	public static function xmp_packet( $source_type = self::AI_SOURCE_TYPE, $padding = '' ) {
		return '<?xpacket begin=""?>'
			. '<x:xmpmeta xmlns:x="adobe:ns:meta/">'
			. '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
			. '<rdf:Description xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/">'
			. '<Iptc4xmpExt:DigitalSourceType>' . $source_type . '</Iptc4xmpExt:DigitalSourceType>'
			. $padding
			. '</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>';
	}

	/**
	 * Build a PNG chunk.
	 *
	 * @param string $type Chunk type.
	 * @param string $data Chunk data.
	 * @return string
	 */
	public static function png_chunk( $type, $data ) {
		return pack( 'N', strlen( $data ) ) . $type . $data . pack( 'N', crc32( $type . $data ) );
	}

	/**
	 * Build a small PNG without metadata.
	 *
	 * @return string
	 */
	public static function bare_png() {
		$image = imagecreatetruecolor( 4, 4 );
		ob_start();
		imagepng( $image );
		return ob_get_clean();
	}

	/**
	 * Add XMP and optional EXIF chunks to a PNG.
	 *
	 * @param string $xmp       XMP packet.
	 * @param bool   $with_exif Whether to add an EXIF chunk.
	 * @return string
	 */
	public static function png_with_xmp( $xmp, $with_exif = false ) {
		$png  = self::bare_png();
		$itxt = self::png_chunk( 'iTXt', "XML:com.adobe.xmp\0\0\0\0\0" . $xmp );
		$exif = $with_exif ? self::png_chunk( 'eXIf', self::EXIF_MARKER ) : '';
		$iend = strlen( $png ) - 12;
		return substr( $png, 0, $iend ) . $itxt . $exif . substr( $png, $iend );
	}

	/**
	 * Build a JPEG segment.
	 *
	 * @param int    $marker Marker byte.
	 * @param string $data   Segment data.
	 * @return string
	 */
	public static function jpeg_segment( $marker, $data ) {
		return "\xFF" . chr( $marker ) . pack( 'n', strlen( $data ) + 2 ) . $data;
	}

	/**
	 * Build a small JPEG without metadata.
	 *
	 * @return string
	 */
	public static function bare_jpeg() {
		$image = imagecreatetruecolor( 8, 8 );
		ob_start();
		imagejpeg( $image, null, 90 );
		return ob_get_clean();
	}

	/**
	 * Add XMP and optional EXIF segments to a JPEG.
	 *
	 * @param string $xmp       XMP packet.
	 * @param bool   $with_exif Whether to add an EXIF segment.
	 * @return string
	 */
	public static function jpeg_with_xmp( $xmp, $with_exif = false ) {
		$jpeg = self::bare_jpeg();
		$xmp  = self::jpeg_segment( 0xE1, "http://ns.adobe.com/xap/1.0/\0" . $xmp );
		$exif = $with_exif ? self::jpeg_segment( 0xE1, "Exif\0\0" . self::EXIF_MARKER ) : '';

		$insert_at = 2;
		if ( "\xFF\xE0" === substr( $jpeg, 2, 2 ) ) {
			$length    = unpack( 'nvalue', substr( $jpeg, 4, 2 ) );
			$insert_at = 4 + $length['value'];
		}

		return substr( $jpeg, 0, $insert_at ) . $xmp . $exif . substr( $jpeg, $insert_at );
	}
}
