<?php
/**
 * Options.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Class Options.
 */
class Options {

	private $key;

	/**
	 * Constructor
	 *
	 * @param $key string Option key.
	 */
	public function __construct( $key ) {
		$this->key = $key;
	}

	/**
	 * Get the option.
	 */
	public function get() {
		return get_option( $this->key, array() );
	}

	/**
	 * Append an item to the options list.
	 */
	public function append( $item ) {
		$all_items = get_option( $this->key, array() );

		if ( ! in_array( $item, $all_items, true ) ) {
			$all_items[] = $item;
			update_option( $this->key, $all_items );
		}
	}

	/**
	 * Delete the option.
	 */
	public function delete() {
		delete_option( $this->key );
	}
}
