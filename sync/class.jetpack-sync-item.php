<?php


class Jetpack_Sync_Item {

	private $object; // The object we are syncing, eg a post
	private $terms; // Terms related to the object, eg categories and tags
	private $state; // The state of the object, eg `is_just_published`
	private $trigger; // The action that triggers the sync operation, eg `save_post`

	function __construct( $trigger, $object = null ) {
		$this->trigger = $trigger;
		if ( ! is_null( $object ) ) {
			$this->set_object( $object );
		}
	}

	function add_terms( Jetpack_Sync_Item $terms ) {
		$this->terms[] = $terms;
	}

	function set_object( $object ) {
		$this->object = $object;
	}

	function get_object() {
		return $this->object;
	}

	function set_state_value( $key, $value = null ) {
		$this->add( $this->state, $key, $value );
	}

	function state_isset( $key ) {
		return isset( $this->state[ $key ] );
	}

	function get_state() {
		return $this->state;
	}

	function set_state( $state ) {
		return $this->state = $state;
	}

	function is_state_value_true( $key ) {
		return (bool) ( $this->state_isset( $key ) && (bool) $this->state[ $key ] );
	}

	private function add( &$array, $key, $value = null ) {
		if ( is_array( $key ) ) {
			$array = array_merge( $key, $array );
		} else if ( is_string( $key ) && ! is_null( $value ) ) {
			$array[ $key ] = $value;
		}
	}

	function get_payload() {
		if ( empty( $this->object ) ) {
			return false;
		}

		$payload = array( 'object' => $this->object );

		if ( ! empty( $this->terms ) ) {
			$payload['terms'] = array_map( array( $this, 'get_sub_sync_item_payload' ), $this->terms );
		}

		if ( ! empty( $this->state ) ) {
			$payload['state'] = $this->state;
		}

		return $payload;
	}

	function get_sub_sync_item_payload( $sync_item ) {
		return $sync_item->get_payload();
	}
}
