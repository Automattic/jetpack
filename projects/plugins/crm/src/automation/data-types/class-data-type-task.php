<?php
/**
 * Task Data Type.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

/**
 * Task Data Type.
 *
 * @since $$next-version$$
 */
class Data_Type_Task extends Data_Type_Base {

	/**
	 * {@inheritDoc}
	 */
	public static function get_slug(): string {
		return 'task';
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_id() {
		return $this->entity['id'];
	}

	/**
	 * Validate entity data.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $entity Task entity data to validate.
	 * @return bool Whether the entity is valid or not.
	 */
	public function validate_entity( $entity ): bool {
		if ( ! is_array( $entity ) ) {
			return false;
		}

		return true;
	}
}
