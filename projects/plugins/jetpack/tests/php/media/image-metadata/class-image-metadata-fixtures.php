<?php
/**
 * Builds in-memory image fixtures carrying (or lacking) provenance metadata.
 *
 * Provenance payloads embed the IPTC DigitalSourceType value
 * `trainedAlgorithmicMedia` so tests can assert it survives, and an EXIF marker
 * so tests can assert EXIF is NOT copied.
 *
 * @package automattic/jetpack
 */

/**
 * Fixture factory. Uses GD to produce structurally valid base images.
 */
class Image_Metadata_Fixtures {

	const SOURCE_TYPE = 'http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia';
	const EXIF_MARKER = 'GPS-EXIF-MUST-NOT-SURVIVE';

	/**
	 * A minimal XMP packet carrying DigitalSourceType.
	 *
	 * @return string
	 */
	public static function xmp_packet() {
		return '<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>'
			. '<x:xmpmeta xmlns:x="adobe:ns:meta/">'
			. '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
			. '<rdf:Description xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/">'
			. '<Iptc4xmpExt:DigitalSourceType>' . self::SOURCE_TYPE . '</Iptc4xmpExt:DigitalSourceType>'
			. '</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>';
	}

	/**
	 * Build a PNG chunk: length + type + data + CRC32(type+data).
	 *
	 * @param string $type Four-character chunk type.
	 * @param string $data Chunk data.
	 * @return string
	 */
	public static function png_chunk( $type, $data ) {
		return pack( 'N', strlen( $data ) ) . $type . $data . pack( 'N', crc32( $type . $data ) );
	}

	/**
	 * A valid PNG with no ancillary metadata.
	 *
	 * @return string
	 */
	public static function bare_png() {
		$img = imagecreatetruecolor( 4, 4 );
		ob_start();
		imagepng( $img );
		return ob_get_clean();
	}

	/**
	 * A PNG carrying an iTXt XMP chunk (provenance) and an eXIf chunk (must be excluded).
	 *
	 * @return string
	 */
	public static function png_with_provenance() {
		$png = self::bare_png();

		// Uncompressed iTXt: keyword \0 compressionFlag(0) compressionMethod(0)
		// languageTag \0 translatedKeyword \0 text.
		$itxt_data  = "XML:com.adobe.xmp\0\0\0\0\0" . self::xmp_packet();
		$xmp_chunk  = self::png_chunk( 'iTXt', $itxt_data );
		$exif_chunk = self::png_chunk( 'eXIf', self::EXIF_MARKER );

		$iend_length_pos = strpos( $png, 'IEND' ) - 4;
		return substr( $png, 0, $iend_length_pos ) . $xmp_chunk . $exif_chunk . substr( $png, $iend_length_pos );
	}

	/**
	 * Build a JPEG marker segment: 0xFF marker length(data+2) data.
	 *
	 * @param int    $marker Marker byte (e.g. 0xE1 for APP1).
	 * @param string $data   Segment payload.
	 * @return string
	 */
	public static function jpeg_segment( $marker, $data ) {
		return "\xFF" . chr( $marker ) . pack( 'n', strlen( $data ) + 2 ) . $data;
	}

	/**
	 * A valid JPEG with no XMP/IPTC metadata (GD emits a JFIF APP0 only).
	 *
	 * @return string
	 */
	public static function bare_jpeg() {
		$img = imagecreatetruecolor( 8, 8 );
		ob_start();
		imagejpeg( $img, null, 90 );
		return ob_get_clean();
	}

	/**
	 * A JPEG carrying APP1 XMP + APP13 Photoshop/IPTC (provenance) and an APP1
	 * EXIF segment (must be excluded), inserted after the leading JFIF APP0.
	 *
	 * @return string
	 */
	public static function jpeg_with_provenance() {
		$jpeg = self::bare_jpeg();

		$app1_xmp   = self::jpeg_segment( 0xE1, "http://ns.adobe.com/xap/1.0/\0" . self::xmp_packet() );
		$app13_iptc = self::jpeg_segment( 0xED, "Photoshop 3.0\0" . '8BIM-IPTC-' . self::SOURCE_TYPE );
		$app1_exif  = self::jpeg_segment( 0xE1, "Exif\0\0" . self::EXIF_MARKER );

		$insert_at = self::after_leading_app0( $jpeg );
		return substr( $jpeg, 0, $insert_at ) . $app1_xmp . $app13_iptc . $app1_exif . substr( $jpeg, $insert_at );
	}

	/**
	 * Offset just past a leading JFIF APP0 segment, or 2 (just past SOI) if none.
	 *
	 * @param string $jpeg JPEG bytes.
	 * @return int
	 */
	private static function after_leading_app0( $jpeg ) {
		if ( "\xFF\xE0" === substr( $jpeg, 2, 2 ) ) {
			$len = unpack( 'n', substr( $jpeg, 4, 2 ) );
			return 2 + 2 + $len[1];
		}
		return 2;
	}
}
