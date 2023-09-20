<?php
/**
 * Company Data Type.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

/**
 * Company Data Type.
 *
 * @since $$next-version$$
 */
class Data_Type_Company extends Data_Type_Base {

	/**
	 * {@inheritDoc}
	 */
	public static function get_slug(): string {
		return 'company';
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_id() {
		return $this->entity['id'];
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_tags() {
		global $zbs;
		return $zbs->DAL->companies->getCompanyTags( $this->get_id() ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}

	/**
	 * Validate entity data.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $entity Company entity data to validate.
	 * @return bool Whether the entity is valid or not.
	 */
	public function validate_entity( $entity ): bool {
		if ( ! is_array( $entity ) ) {
			return false;
		}

		return true;
	}
}
