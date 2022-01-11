<?php

namespace Automattic\Jetpack_Boost\Lib;

/**
 * A collection of WordPress options that's stored as a single ar
 */
class Collection {

	/**
	 * Options key.
	 *
	 * @var string Options key.
	 */
	private $key;

	private $autoload;

	/**
	 * @param string $key Collection key.
	 */
	public function __construct( $key, $autoload = false ) {
		$this->key      = $key;
		$this->autoload = $autoload;
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

	public function append( $item ) {
		$items = $this->get();

		if ( ! in_array( $item, $items, true ) ) {
			$items[] = $item;
			update_option( $this->key, $items, $this->autoload );
		}
	}

	public function delete() {
		delete_option( $this->key );
	}
}
