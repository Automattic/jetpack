<?php
/**
 * A minimal stream wrapper used only to prove that `Metadata_Preserver` never
 * attempts to open a stream-wrapped "original" file.
 *
 * @package automattic/jetpack
 */

/**
 * Every method that could lead to a file read counts the attempt in a static
 * counter, so a test can assert it stayed at zero, independent of `WP_DEBUG`
 * or error suppression.
 */
class Image_Metadata_Stream_Probe {

	/** @var resource|null Set by PHP for stream context. */
	public $context;

	/** @var int Number of times PHP tried to open a provprobe:// path. */
	public static $opens = 0;

	/**
	 * Called by PHP when something tries to open a `provprobe://` path (for
	 * example via `file_get_contents()`). Counts the attempt and refuses it.
	 *
	 * @param string $path        The requested stream path.
	 * @param string $mode        The fopen() mode.
	 * @param int    $options     Bitmask of STREAM_* option flags.
	 * @param string $opened_path Absolute path actually opened, if applicable.
	 * @return bool Always false — we only need to detect the attempt.
	 */
	public function stream_open( $path, $mode, $options, &$opened_path ) {
		unset( $path, $mode, $options, $opened_path );
		++self::$opens;
		return false; // We only need to detect the attempt; refusing is fine.
	}

	/**
	 * Called by PHP for file_exists()/is_file()-style checks.
	 *
	 * @param string $path  The requested stream path.
	 * @param int    $flags Bitmask of STREAM_URL_STAT_* flags.
	 * @return bool Always false — the probe path never "exists".
	 */
	public function url_stat( $path, $flags ) {
		unset( $path, $flags );
		return false;
	}
}
