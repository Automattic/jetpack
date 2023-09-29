<?php
/**
 * Tag_List Data Type.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

use Automattic\Jetpack\CRM\Automation\Data_Type_Exception;

/**
 * Tag_List Data Type.
 *
 * @since $$next-version$$
 */
class Tag_List_Data extends Data_Type_Base {

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
	 * @throws Data_Type_Exception If the tag list is not valid.
	 */
	public function validate_data( $data ): bool {
		if ( ! is_array( $data ) ) {
			throw new Data_Type_Exception(
				sprintf( 'Invalid tag list' ),
				Data_Type_Exception::INVALID_DATA
			);
		}

		return true;
	}
}
