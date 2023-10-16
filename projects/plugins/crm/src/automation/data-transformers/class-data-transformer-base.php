<?php
/**
 * Base Data Transformer class.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Transformers;

use Automattic\Jetpack\CRM\Automation\Data_Transformer_Exception;
use Automattic\Jetpack\CRM\Automation\Data_Type_Exception;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;

/**
 * Base Data Transformer class.
 *
 * @since 6.2.0
 */
abstract class Data_Transformer_Base {

	/**
	 * Validate the data type we transform from.
	 *
	 * @param Data_Type $data The data type we want to transform.
	 * @return bool Return true if the data type is valid.
	 *
	 * @throws Data_Transformer_Exception Throw if the data type is not valid.
	 */
	protected function validate_from_type( Data_Type $data ): bool {

		$from_data_type = $this->get_from();

		if ( ! $data instanceof $from_data_type ) {
			throw new Data_Transformer_Exception(
				'Invoice data type is not valid.',
				Data_Type_Exception::INVALID_DATA
			);
		}

		return true;
	}

	/**
	 * Get the slug of the data transformer.
	 *
	 * This is meant to be unique and is used to make it easier for third
	 * parties to identify the data type in filters.
	 *
	 * Example: 'invoice_to_contact', 'contact_to_woo_customer', etc.
	 *
	 * @since 6.2.0
	 *
	 * @return string The slug of the data transformer.
	 */
	abstract public static function get_slug(): string;

	/**
	 * Get the data type class we transform from.
	 *
	 * @since 6.2.0
	 *
	 * @return string The data type class we transform from.
	 */
	abstract public static function get_from(): string;

	/**
	 * Get the data type class we transform to.
	 *
	 * @since 6.2.0
	 *
	 * @return string The data type class we transform to.
	 */
	abstract public static function get_to(): string;

	/**
	 * Transform the data type into another type.
	 *
	 * This method should transform the data to the "to" data type.
	 *
	 * @since 6.2.0
	 *
	 * @param Data_Type $data The data type we want to transform.
	 * @return Data_Type Return a transformed data type.
	 */
	abstract public function transform( Data_Type $data ): Data_Type;
}
