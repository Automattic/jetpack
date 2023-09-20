<?php
/**
 * CRM Object to CRM Tag List Transformer class.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Transformers;

use Automattic\Jetpack\CRM\Automation\Data_Transformer_Exception;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Base;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type_Tag_list;

/**
 * CRM Contact to CRM Tag List Transformer class.
 *
 * @since $$next-version$$
 */
class Data_Transformer_Object_To_Tag_List extends Data_Transformer_Base {

	/**
	 * {@inheritDoc}
	 */
	public static function get_slug(): string {
		return 'object_to_tag_list';
	}

	/**
	 * Get the slug name of the Data Type.
	 *
	 * @since $$next-version$$
	 *
	 * @param Data_Type_Base $data The object data type we want to get the slug from.
	 * @return string The slug of the Data Type.
	 */
	public static function get_from( Data_Type_Base $data ): string {
		return $data->get_slug();
	}

	/**
	 * Get the tags from an object.
	 *
	 * @since $$next-version$$
	 *
	 * @param Data_Type_Base $data The object data type we want to get the tags from.
	 * @return array The object tags as an array.
	 */
	public static function get_tags( Data_Type_Base $data ): array {
		return $data->get_tags();
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_to(): string {
		return Data_Type_Tag_list::get_slug();
	}

	/**
	 * Transform object entity to a list of tags.
	 *
	 * @since $$next-version$$
	 *
	 * @param Data_Type_Base $data The object data type we want to transform.
	 * @return Data_Type_Base Return the Data_Type_Tag of the object.
	 *
	 * @throws Data_Transformer_Exception If the object is not linked to a tag.
	 */
	public function transform( Data_Type_Base $data ): Data_Type_Base {

		$tags = $this->get_tags( $data );

		if ( ! $tags ) {
			throw new Data_Transformer_Exception(
				'No tags are linked to the object.',
				Data_Transformer_Exception::MISSING_LINK
			);
		}

		return new Data_Type_Tag_List( $tags );
	}
}
