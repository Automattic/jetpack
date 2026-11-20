<?php

namespace Automattic\Jetpack_Boost\Lib\Minify;

use Automattic\Jetpack\Boost_Core\Lib\Cacheable;
use Automattic\Jetpack\Boost_Core\Lib\Transient;

/**
 * Store the hash of the path string so that the concatenated file can be constructed
 * on-demand.
 *
 * We are setting the transient for a long time because, if the content of the hash is not accessible, the concatenated file
 * will not be able to construct itself. Because of page caching, there may be situations where this function will not
 * get called for a long time, and we still want to serve the concatenated file in those cases. Having the value in
 * a Boost Transient ensures that the value is cleaned up when Boost is uninstalled.
 *
 * Only lists stored here are built.
 */
final class File_Paths extends Cacheable {
	private $paths;
	private $mtime;
	private $cache_buster;

	protected const DEFAULT_EXPIRY = MONTH_IN_SECONDS;

	public function set( $paths, $mtime, $cache_buster ) {
		$this->paths        = $paths;
		$this->mtime        = $mtime;
		$this->cache_buster = $cache_buster;
	}

	public function jsonSerialize(): array {
		return array(
			'paths'        => $this->paths,
			'mtime'        => $this->mtime,
			'cache_buster' => $this->cache_buster,
		);
	}

	/**
	 * Get an array of file paths that belong to the same hash.
	 *
	 * @return array Array of file paths relative to the webroot.
	 */
	public function get_paths() {
		return $this->paths;
	}

	public static function jsonUnserialize( $data ) {
		$instance = new self();
		$instance->set( $data['paths'], $data['mtime'], $data['cache_buster'] );
		return $instance;
	}

	/**
	 * Whether a string has the form of the IDs generate_cache_id() produces.
	 *
	 * @param string $id The string to check.
	 *
	 * @return bool
	 */
	public static function is_id( $id ) {
		return 1 === preg_match( '/^[0-9a-f]{10}$/D', $id );
	}

	/**
	 * Get a stored list by its ID.
	 *
	 * @param string $id The list ID.
	 *
	 * @return self|null
	 */
	public static function get_issued( $id ) {
		$issued = self::get( $id );

		if ( ! $issued ) {
			// WordPress notes every missing option in one shared cache entry, which made-up IDs would keep growing.
			$missing_options = wp_cache_get( 'notoptions', 'options' );
			$option_name     = Transient::key( self::cache_prefix() . $id );
			if ( is_array( $missing_options ) && isset( $missing_options[ $option_name ] ) ) {
				unset( $missing_options[ $option_name ] );
				wp_cache_set( 'notoptions', $missing_options, 'options' );
			}
		}

		return $issued;
	}

	/**
	 * Find the stored list holding exactly these paths, by the ID built from them, their newest modification time and the current cache buster.
	 *
	 * @param string[] $paths        File paths in list order.
	 * @param int      $mtime        Newest modification time of the files.
	 * @param int      $cache_buster Current cache buster.
	 *
	 * @return self|null
	 */
	public static function find_issued( $paths, $mtime, $cache_buster ) {
		$candidate = new self();
		$candidate->set( $paths, $mtime, $cache_buster );

		$issued = self::get_issued( $candidate->generate_cache_id() );

		// IDs are short enough for different lists to share one, so compare the lists as well.
		// Stored stylesheet lists are keyed by handle, so only the values and their order count.
		return $issued && is_array( $issued->get_paths() ) && array_values( $issued->get_paths() ) === $paths ? $issued : null;
	}

	protected function generate_cache_id() {
		$hash = md5( implode( ',', $this->paths ) . '_' . $this->mtime . '_' . $this->cache_buster );

		// Keep cache id small as option keys have a character limit.
		return substr( $hash, 0, 10 );
	}

	protected static function cache_prefix() {
		return 'concat_paths_';
	}
}
