<?php

namespace Automattic\Jetpack_Boost\Lib;

/**
 * A collection of WordPress options that's stored as a single ar
 */
class Collection {

	private $key;

	/**
	 * Collections imply that they may carry more data than regular options,
	 * This might unnecessarily slow down sites.
	 * Disable autoloading by default.
	 *
	 * @see autoload() to enable autoloading.
	 *
	 * @var bool
	 */
	private $autoload = false;

	/**
	 * @param string $key Collection key.
	 */
	public function __construct( $key ) {
		$this->key = $key;
	}

	/**
	 * Allow autoloading collections
	 */
	public function autoload() {
		$this->autoload = true;
		return $this;
	}

	/**
	 * Get the whole collection
	 *
	 * @return array
	 */
	public function get() {
		$result = get_option( $this->key, array() );
		if ( is_array( $result ) ) {
			return $result;
		}
		return array();
	}

	/**
	 * Append a single item to the collection
	 *
	 * @param mixed $item
	 *
	 * @return bool
	 */
	public function append( $item ) {
		$items = $this->get();

		if ( ! in_array( $item, $items, true ) ) {
			$items[] = $item;
			return update_option( $this->key, $items, $this->autoload );
		}

		return false;
	}

	/**
	 * Delete the whole collection
	 *
	 * @return bool
	 */
	public function delete() {
		return delete_option( $this->key );
	}
}
