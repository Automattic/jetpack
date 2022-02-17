<?php
/**
 * Critical CSS storage.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Storage_Post_Type;

/**
 * Critical CSS Storage class
 */
class Critical_CSS_Storage {

	/**
	 * Storage post type.
	 *
	 * @var Storage_Post_Type
	 */
	protected $storage;

	/**
	 * Critical_CSS_Storage constructor.
	 */
	public function __construct() {
		$this->storage = new Storage_Post_Type( 'css' );
	}

	/**
	 * Store Critical CSS for a specific provider.
	 *
	 * @param string $key   Provider key.
	 * @param string $value Critical CSS.
	 */
	public function store_css( $key, $value ) {
		$this->storage->set(
			$key,
			array(
				'css' => $value,
			)
		);
	}

	/**
	 * Clear the whole Critical CSS storage.
	 */
	public function clear() {
		$this->storage->clear();
	}

	/**
	 * Get Critical CSS for specific provider keys.
	 *
	 * @param array $provider_keys Provider keys.
	 *
	 * @return array|false
	 */
	public function get_css( $provider_keys ) {
		foreach ( $provider_keys as $key ) {
			$data = $this->storage->get( $key, false );
			if ( $data && $data['css'] ) {
				return array(
					'key' => $key,
					'css' => $data['css'],
				);
			}
		}

		return false;
	}
}
