<?php
/**
 * Notifications.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Notifications.
 */
class Options_Array {
	/**
	 * Option key.
	 *
	 * @var $key
	 */
	private $key;

	/**
	 * Constructor.
	 *
	 * @param string $key option key.
	 */
	public function __construct( $key ) {
		$this->key = $key;
	}

	/**
	 * Get all the items stored in the options.
	 */
	public function get() {
		return \get_option( $this->key, array() );
	}

	/**
	 * Add an item to the options list.
	 *
	 * @param string $item Item to add.
	 */
	public function add( $item ) {
		$all_items = \get_option( $this->key, array() );

		if ( ! in_array( $item, $all_items, true ) ) {
			$all_items[] = $item;
			\update_option( $this->key, $all_items );
		}
	}

	/**
	 * Delete all the items in the list.
	 */
	public function delete() {
		\delete_option( $this->key );
	}
}
