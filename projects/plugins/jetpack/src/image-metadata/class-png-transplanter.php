<?php
/**
 * PNG provenance transplanter.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Copies XMP/IPTC text chunks verbatim between PNG files. EXIF (the `eXIf`
 * chunk) is deliberately excluded.
 */
final class PNG_Transplanter extends Abstract_Transplanter {

	/**
	 * PNG 8-byte signature.
	 */
	const SIGNATURE = "\x89PNG\r\n\x1a\n";

	/**
	 * Text-chunk keywords that carry provenance we preserve.
	 *
	 * @var string[]
	 */
	private static $provenance_keywords = array(
		'XML:com.adobe.xmp',
		'Raw profile type xmp',
		'Raw profile type iptc',
	);

	/**
	 * PNG text chunk types whose first NUL-delimited field is a keyword.
	 *
	 * @var string[]
	 */
	private static $text_chunk_types = array( 'tEXt', 'zTXt', 'iTXt' );

	/**
	 * Check whether this transplanter handles a given MIME type.
	 *
	 * @param string $mime MIME type.
	 * @return bool
	 */
	public function supports( $mime ) {
		return 'image/png' === $mime;
	}

	/**
	 * Read the provenance segments from a source file.
	 *
	 * @param string $source_path Absolute path.
	 * @return Payload|null
	 */
	public function extract( $source_path ) {
		$bytes = $this->read( $source_path );
		if ( null === $bytes || 0 !== strpos( $bytes, self::SIGNATURE ) ) {
			return null;
		}

		$segments = array();
		foreach ( $this->walk_chunks( $bytes ) as $chunk ) {
			if ( $this->is_provenance_chunk( $chunk['type'], $chunk['data'] ) ) {
				$segments[] = $chunk['raw'];
			}
		}
		return new Payload( 'image/png', $segments );
	}

	/**
	 * Check whether a derivative already carries provenance segments.
	 *
	 * @param string $target_path Absolute path.
	 * @return bool
	 */
	public function has_payload( $target_path ) {
		$bytes = $this->read( $target_path );
		if ( null === $bytes || 0 !== strpos( $bytes, self::SIGNATURE ) ) {
			return false;
		}
		foreach ( $this->walk_chunks( $bytes ) as $chunk ) {
			if ( $this->is_provenance_chunk( $chunk['type'], $chunk['data'] ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Splice the provenance chunks in immediately before the IEND chunk.
	 *
	 * Chunks are copied byte-for-byte, so their existing CRC32 is already valid —
	 * no recompute is needed.
	 *
	 * @param string  $bytes   Current PNG bytes.
	 * @param Payload $payload Segments to insert.
	 * @return string|null
	 */
	protected function build_injected_bytes( $bytes, Payload $payload ) {
		if ( 0 !== strpos( $bytes, self::SIGNATURE ) ) {
			return null;
		}
		$iend_start = null;
		foreach ( $this->walk_chunks( $bytes ) as $chunk ) {
			if ( 'IEND' === $chunk['type'] ) {
				$iend_start = $chunk['pos'];
				break;
			}
		}
		if ( null === $iend_start ) {
			return null;
		}
		return substr( $bytes, 0, $iend_start )
			. implode( '', $payload->get_segments() )
			. substr( $bytes, $iend_start );
	}

	/**
	 * Walk PNG chunks. Yields `type`, `data`, `raw` (length+type+data+crc), and
	 * `pos` (offset of the chunk's length field). Guards against a length field
	 * that runs past the buffer (corrupt/truncated).
	 *
	 * @param string $bytes PNG bytes.
	 * @return \Generator
	 */
	private function walk_chunks( $bytes ) {
		$len = strlen( $bytes );
		$pos = 8; // Skip the signature.
		while ( $pos + 12 <= $len ) {
			$length_field = unpack( 'N', substr( $bytes, $pos, 4 ) );
			$length       = $length_field[1];
			if ( $pos + 12 + $length > $len ) {
				break; // Corrupt: declared length overruns the file.
			}
			$type = substr( $bytes, $pos + 4, 4 );
			$data = substr( $bytes, $pos + 8, $length );
			$raw  = substr( $bytes, $pos, 12 + $length );

			yield array(
				'type' => $type,
				'data' => $data,
				'raw'  => $raw,
				'pos'  => $pos,
			);

			if ( 'IEND' === $type ) {
				break;
			}
			$pos += 12 + $length;
		}
	}

	/**
	 * Check whether a chunk is a text chunk carrying a provenance keyword.
	 *
	 * @param string $type Chunk type.
	 * @param string $data Chunk data.
	 * @return bool True when this is a text chunk whose keyword is provenance.
	 */
	private function is_provenance_chunk( $type, $data ) {
		if ( ! in_array( $type, self::$text_chunk_types, true ) ) {
			return false;
		}
		$nul = strpos( $data, "\0" );
		if ( false === $nul ) {
			return false;
		}
		return in_array( substr( $data, 0, $nul ), self::$provenance_keywords, true );
	}
}
