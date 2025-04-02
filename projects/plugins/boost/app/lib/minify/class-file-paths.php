<?php

namespace Automattic\Jetpack_Boost\Lib\Minify;

use Automattic\Jetpack\Boost_Core\Lib\Cacheable;

/**
 * Store the hash of the path string so that the concatenated file can be constructed
 * on-demand.
 *
 * We are setting the transient for a long time because, if the content of the hash is not accessible, the concatenated file
 * will not be able to construct itself. Because of page caching, there may be situations where this function will not
 * get called for a long time, and we still want to serve the concatenated file in those cases. Having the value in
 * a Boost Transient ensures that the value is cleaned up when Boost is uninstalled.
 */
final class File_Paths extends Cacheable {
	private $paths;
	private $mtime;
	private $cache_buster;

	protected const DEFAULT_EXPIRY = YEAR_IN_SECONDS;

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

	protected function generate_cache_id() {
		$hash = md5( implode( ',', $this->paths ) . '_' . $this->mtime . '_' . $this->cache_buster );

		// Keep cache id small as option keys have a character limit.
		return substr( $hash, 0, 10 );
	}

	protected static function cache_prefix() {
		return 'concat_paths_';
	}
}
