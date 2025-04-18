<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers\Cornerstone_Provider;
use Automattic\Jetpack_Boost\Lib\Storage_Post_Type;
/**
 * LCP Storage class
 */
class LCP_Storage {
	/**
	 * Storage post type.
	 *
	 * @var Storage_Post_Type
	 */
	protected $storage;

	/**
	 * LCP_Storage constructor.
	 */
	public function __construct() {
		$this->storage = new Storage_Post_Type( 'lcp' );
	}

	/**
	 * Store LCP data for a specific page.
	 *
	 * @param string $key   Page key.
	 * @param array  $data  LCP data.
	 */
	public function store_lcp( $key, $data ) {
		$this->storage->set(
			$key,
			$data
		);
	}

	/**
	 * Clear the whole LCP storage.
	 */
	public function clear() {
		$this->storage->clear();
	}

	/**
	 * Get LCP data for a specific page key.
	 *
	 * @param string $page_key Page key.
	 *
	 * @return array|false
	 */
	public function get_lcp( $page_key ) {
		return $this->storage->get( $page_key, false );
	}

	/**
	 * Get LCP data for the current request.
	 *
	 * @return array|false LCP data for the current request, or false if not found.
	 */
	public function get_current_request_lcp() {
		// @TODO: this is a temporary solution to get the LCP data for the current request. Cornerstone Provider should be decoupled from the CSS storage.
		$current_url = Cornerstone_Provider::get_request_url();
		$key         = Cornerstone_Provider::get_provider_key( $current_url );
		if ( empty( $key ) ) {
			return false;
		}

		return $this->get_lcp( $key );
	}
}
