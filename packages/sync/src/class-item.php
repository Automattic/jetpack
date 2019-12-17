<?php
/**
 * Item is a generic class which helps us bring uniformity to data that we sent.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

/**
 * Sync Item class lets us bring uniformity to the Sync Data that we send.
 */
class Item {
	/**
	 * The state of the object, eg `just_published`.
	 *
	 * @var mixed
	 */
	private $state;

	/**
	 * Item constructor.
	 *
	 * @param string $trigger What caused the Sync Item to be added.
	 */
	public function __construct( $trigger ) {
		$this->trigger = $trigger;
		return $this;
	}

	/**
	 * Adds the state value.
	 *
	 * @param string $key Key under which we need to store the value under.
	 * @param mixed  $value Value of the key that we want to store.
	 */
	public function add_state_value( $key, $value ) {
		$this->state[ $key ] = $value;
	}

	/**
	 * Checks the state value.
	 *
	 * @param string $key Key that to check.
	 *
	 * @return bool Whether the staye key is set.
	 */
	public function has_state( $key ) {
		return isset( $this->state[ $key ] );
	}

	/**
	 * Checks if the state value for a key is set to true.
	 *
	 * @param string $key Key to check.
	 *
	 * @return bool Whether the value of the key is set and if the value is true.
	 */
	public function is_state_value_true( $key ) {
		return ( $this->has_state( $key ) && (bool) $this->get_state_value( $key ) );
	}

	/**
	 * Get a specific key value.
	 *
	 * @param string $key Key to retrieve the value for.
	 *
	 * @return mixed|null
	 */
	public function get_state_value( $key ) {
		if ( $this->has_state( $key ) ) {
			return $this->state[ $key ];
		}

		return null;
	}

	/**
	 * Get the whole state array from Sync Item.
	 *
	 * @return array mixed State of the sync item.
	 */
	public function get_state() {
		return $this->state;
	}

	/**
	 * Remove item from the state array.
	 *
	 * @param string $key Key to unset the value of.
	 */
	public function unset_state( $key ) {
		if ( $this->has_state( $key ) ) {
			unset( $this->state[ $key ] );
		}
	}
}
