<?php
namespace Automattic\Jetpack_Boost\Lib;

class Collection {

	/**
	 * Options key.
	 *
	 * @var string Options key.
	 */
	private $key;

	/**
	 * @param string $key Option key.
	 */
	public function __construct( $key ) {
		$this->key = $key;
	}

	/**
	 * Get option array value.
	 *
	 * @return false|mixed|void
	 */
	public function get() {
		return get_option( $this->key, array() );
	}

	/**√
	 * @param  mixed $item Option item to append.
	 */
	public function append( $item ) {
		$all_items = get_option( $this->key, array() );

		if ( ! in_array( $item, $all_items, true ) ) {
			$all_items[] = $item;
			update_option( $this->key, $all_items );
		}
	}

	public function delete() {
		delete_option( $this->key );
	}
}
