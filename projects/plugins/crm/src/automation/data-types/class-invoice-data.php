<?php
/**
 * Invoice Data Type.
 *
 * @package automattic/jetpack-crm
 * @since 6.2.0
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

use Automattic\Jetpack\CRM\Entities\Invoice;

/**
 * Invoice Data Type.
 *
 * @since 6.2.0
 */
class Invoice_Data extends Data_Type_Base implements Entity_Data {

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
	public function validate_data( $data ): bool {
		return $data instanceof Invoice;
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_tags(): array {
		global $zbs;
		return $zbs->DAL->getTagsForObjID( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			array(
				'objtypeid' => ZBS_TYPE_INVOICE,
				$this->get_data()->id,
			)
		);
	}
}
