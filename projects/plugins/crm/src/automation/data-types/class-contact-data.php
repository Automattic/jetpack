<?php
/**
 * Contact Data Type.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

use Automattic\Jetpack\CRM\Entities\Contact;

/**
 * Contact Data Type.
 *
 * @since $$next-version$$
 */
class Contact_Data extends Data_Type_Base implements Entity_Data {

	/**
	 * Validate the data.
	 *
	 * This method is meant to validate if the data has the expected inheritance
	 * or structure and will be used to throw a fatal error if not.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $data The data to validate.
	 * @return bool Whether the data is valid.
	 */
	public function validate_data( $data ): bool {
		return $data instanceof Contact;
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_tags(): array {
		global $zbs;
		return $zbs->DAL->contacts->getContactTags( $this->get_data()->id ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	}
}
