<?php
/**
 * Base Data Transformer class.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Transformers;

use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Base;

/**
 * Base Data Transformer class.
 *
 * @since $$next-version$$
 */
abstract class Data_Transformer_Base {

	/**
	 * Get the slug of the data transformer.
	 *
	 * This is meant to be unique and is used to make it easier for third
	 * parties to identify the data type in filters.
	 *
	 * Example: 'invoice_to_contact', 'contact_to_woo_customer', etc.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug of the data transformer.
	 */
	abstract public static function get_slug(): string;

	/**
	 * Get the slug of the data type we transform from.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug of the data type we transform from.
	 */
	abstract public static function get_from(): string;

	/**
	 * Get the slug of the data type we transform to.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug of the data type we transform to.
	 */
	abstract public static function get_to(): string;

	/**
	 * Transform the entity.
	 *
	 * This method should transform the entity to the "to" data type.
	 *
	 * @since $$next-version$$
	 *
	 * @param Data_Type_Base $data The data type we want to transform.
	 * @return Data_Type_Base Return a transformed data type.
	 */
	abstract public function transform( Data_Type_Base $data ): Data_Type_Base;

}
