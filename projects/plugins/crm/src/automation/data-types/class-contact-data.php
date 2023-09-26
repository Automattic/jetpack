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
class Contact_Data extends Data_Type_Base {

	/**
	 * {@inheritDoc}
	 */
	public function validate_data( $data ): bool {
		return $data instanceof Contact;
	}
}
