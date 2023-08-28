<?php
/**
 * Jetpack CRM Entity base class.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Entities;

use ArrayAccess;

/**
 * Entity base class.
 *
 * @since $$next-version$$
 */
abstract class Entity implements ArrayAccess {

	/**
	 * The field map.
	 *
	 * @return array The field map.
	 */
	abstract protected function get_field_map(): array;

	/**
	 * offsetExists implementation
	 *
	 * @param mixed $offset The offset.
	 * @return bool Whether the offset exists.
	 */
	public function offsetExists( $offset ): bool {
		return in_array( $offset, $this->get_field_map(), true );
	}

	/**
	 * offsetGet implementation
	 *
	 * @param mixed $offset The offset.
	 * @return mixed The value.
	 */
	public function offsetGet( $offset ): mixed {
		return in_array( $offset, $this->get_field_map(), true ) ? $this->{ $offset } : null;
	}

	/**
	 * offsetSet implementation
	 *
	 * @param mixed $offset The offset.
	 * @param mixed $value The value.
	 * @return void
	 */
	public function offsetSet( $offset, $value ): void {
		if ( in_array( $offset, $this->get_field_map(), true ) ) {
			$this->{ $offset } = $value;
		}
	}

	/**
	 * offsetUnset implementation
	 *
	 * @param mixed $offset The offset.
	 * @return void
	 */
	public function offsetUnset( $offset ): void {
		if ( in_array( $offset, $this->get_field_map(), true ) ) {
			$this->{ $offset } = null;
		}
	}
}
