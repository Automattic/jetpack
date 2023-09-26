<?php
/**
 * Invoice Data Type.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

use Automattic\Jetpack\CRM\Entities\Invoice;

/**
 * Invoice Data Type.
 *
 * @since $$next-version$$
 */
class Invoice_Data extends Data_Type_Base {

	/**
	 * {@inheritDoc}
	 */
	public function validate_data( $data ): bool {
		return $data instanceof Invoice;
	}
}
