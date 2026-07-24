<?php
/**
 * Stream wrapper for detecting reads of remote originals.
 *
 * @package automattic/jetpack
 */

/**
 * Counts attempts to open probe paths.
 */
class Image_Metadata_Stream_Probe {

	/** @var resource|null Set by PHP for stream context. */
	public $context;

	/** @var int Number of times PHP tried to open a provprobe:// path. */
	public static $opens = 0;

	/**
	 * Count and refuse an attempt to open a probe path.
	 *
	 * @param string $path        The requested stream path.
	 * @param string $mode        The fopen() mode.
	 * @param int    $options     Bitmask of STREAM_* option flags.
	 * @param string $opened_path Absolute path actually opened, if applicable.
	 * @return bool Always false.
	 */
	public function stream_open( $path, $mode, $options, &$opened_path ) {
		unset( $path, $mode, $options, $opened_path );
		++self::$opens;
		return false;
	}

	/**
	 * Report that a probe path does not exist.
	 *
	 * @param string $path  The requested stream path.
	 * @param int    $flags Bitmask of STREAM_URL_STAT_* flags.
	 * @return bool Always false.
	 */
	public function url_stat( $path, $flags ) {
		unset( $path, $flags );
		return false;
	}
}
