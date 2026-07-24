<?php
/**
 * PNG provenance transplanter.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Copies XMP/IPTC text chunks between PNG files, excluding EXIF containers.
 */
final class PNG_Transplanter extends Abstract_Transplanter {

	/**
	 * PNG 8-byte signature.
	 */
	const SIGNATURE = "\x89PNG\r\n\x1a\n";

	/**
	 * Chunk overhead: length, type, and CRC.
	 */
	const CHUNK_OVERHEAD = 12;

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
	 * Insert chunks before IEND. Their copied CRC values remain valid.
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
	 * Yield PNG chunks through IEND, stopping at malformed or truncated data.
	 *
	 * @param string $bytes PNG bytes.
	 * @return \Generator
	 */
	private function walk_chunks( $bytes ) {
		$len = strlen( $bytes );
		$pos = 8; // Skip the 8-byte PNG signature.

		while ( $pos + self::CHUNK_OVERHEAD <= $len ) {
			// PHP on 32-bit systems may unpack large unsigned lengths as negative.
			$length    = unpack( 'N', substr( $bytes, $pos, 4 ) )[1];
			$chunk_end = $pos + self::CHUNK_OVERHEAD + $length;
			if ( $length < 0 || $chunk_end > $len ) {
				break;
			}

			$type = substr( $bytes, $pos + 4, 4 );

			yield array(
				'type' => $type,
				'data' => substr( $bytes, $pos + 8, $length ),
				'raw'  => substr( $bytes, $pos, $chunk_end - $pos ),
				'pos'  => $pos,
			);

			if ( 'IEND' === $type ) {
				break;
			}
			$pos = $chunk_end;
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
