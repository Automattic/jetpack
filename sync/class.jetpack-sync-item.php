<?php


class Jetpack_Sync_Item {

	private $object;
	private $sync_items;
	private $meta_data;
	private $trigger;

	function __construct( $trigger, $object = null ) {
		$this->trigger = $trigger;
		if ( ! is_null( $object ) ) {
			$this->set_object( $object );
		}
	}

	function add_sync_item( Jetpack_Sync_Item $sync_item ) {
		$this->sync_items[] = $sync_item;
	}

	function set_object( $object ) {
		$this->object = $object;
	}

	function get_object() {
		return $this->object;
	}

	function add_meta( $key, $value = null ) {
		$this->add( $this->meta_data, $key, $value );
	}

	function has_meta( $key ) {
		return isset( $this->meta_data[ $key ] );
	}

	function get_meta() {
		return $this->meta_data;
	}

	function set_meta( $meta ) {
		return $this->meta_data = $meta;
	}

	function is_meta_true( $key ) {
		return (bool) ( $this->has_meta( $key ) && $this->meta_data[ $key ] );
	}

	private function add( &$array, $key, $value = null ) {
		if ( is_array( $key ) ) {
			$array = array_merge( $key, $array );
		} else if( is_string( $key ) && ! is_null( $value ) ) {
			$array[ $key ] = $value;
		}
	}

	function get_payload() {
		if ( empty( $this->object ) ) {
			return false;
		}

		$payload = array( 'object' => $this->object );

		if ( ! empty( $this->sync_items ) ) {
			$payload['sync_items'] = array_map( array( $this, 'get_sub_sync_item_payload' ), $this->sync_items );
		}

		if ( ! empty($this->meta_data ) ) {
			$payload['meta_data'] = $this->meta_data;
		}

		return $payload;
	}

	function get_sub_sync_item_payload( $sync_item ) {
		return $sync_item->get_payload();
	}
}
