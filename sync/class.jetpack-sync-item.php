<?php

class Jetpack_Sync_Item {
	private $object; // The object we are syncing, eg a post
	private $items = array(); // Related sync items that we want to send in the same request, eg categories and tags, post meta, revision
	private $state; // The state of the object, eg `is_just_published`
	private $trigger; // The action that triggers the sync operation, eg `save_post`

	function __construct( $trigger, $object = null ) {
		$this->trigger = $trigger;
		if ( $object ) {
			$this->set_object( $object );
		}
	}

	function add_sync_item( Jetpack_Sync_Item $item ) {
		$this->items[] = $item;
	}

	function set_object( $object ) {
		$this->object = $object;
	}

	function get_object() {
		return $this->object;
	}

	function set_state_value( $key, $value = null ) {
		if ( is_array( $key ) ) {
			$this->state = array_merge( $this->state, $key );
		} else if ( is_string( $key ) && ! is_null( $value ) ) {
			$this->state[ $key ] = $value;
		}
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
		return ( $this->state_isset( $key ) && (bool) $this->state[ $key ] );
	}

	function get_payload() {
		if ( empty( $this->object ) ) {
			return false;
		}
		$payload = array( 'object' => $this->object, 'trigger' => $this->trigger );
		foreach ( $this->items as $item ) {
			$payload[ 'items' ][] = $item->get_payload();
		}
		if ( ! empty( $this->state ) ) {
			$payload[ 'state' ] = $this->state;
		}

		return $payload;
	}
}
