<?php
/**
 * Data Type Interface class.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

/**
 * Data Type Interface.
 *
 * @since 6.2.0
 */
interface Data_Type {

	/**
	 * Validate the data.
	 *
	 * This method is meant to validate if the data has the expected inheritance
	 * or structure and will be used to throw a fatal error if not.
	 *
	 * @since 6.2.0
	 *
	 * @param mixed $data The data to validate.
	 * @return bool Whether the data is valid.
	 */
	public function validate_data( $data ): bool;

	/**
	 * Get the data.
	 *
	 * We do not know what shape this takes. It could be a class, object,
	 * or array.
	 *
	 * @since 6.2.0
	 *
	 * @return mixed
	 */
	public function get_data();

	/**
	 * Get the previous data, if any.
	 *
	 * We do not know what shape this takes. It could be a class, object,
	 * or array.
	 *
	 * @since 6.2.0
	 *
	 * @return mixed
	 */
	public function get_previous_data();
}
