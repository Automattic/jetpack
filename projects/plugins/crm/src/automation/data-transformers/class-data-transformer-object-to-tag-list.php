<?php
/**
 * CRM Object to CRM Tag List Transformer class.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Transformers;

use Automattic\Jetpack\CRM\Automation\Data_Transformer_Exception;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;
use Automattic\Jetpack\CRM\Automation\Data_Types\Tag_List_Data;

/**
 * CRM Object to CRM Tag List Transformer class.
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
	 * @param Data_Type $data The object data type we want to get the slug from.
	 * @return string The slug of the Data Type.
	 *
	 * @throws Data_Transformer_Exception If the object type cannot be transformed to a tag list.
	 */
	public static function get_from( Data_Type $data ): string {

		switch ( $data ) {
			case ( $data instanceof Company ):
				return Company_Data::class;
			case ( $data instanceof Contact ):
				return Contact_Data::class;
			case ( $data instanceof Invoice ):
				return Invoice_Data::class;
			case ( $data instanceof Transaction ):
				return Transaction_Data::class;
			case ( $data instanceof Quote ):
				return Quote_Data::class;
			case ( $data instanceof Task ):
				return Task_Data::class;
			default:
				throw new Data_Transformer_Exception(
					'Object type cannot be transformed to tag list.',
					Data_Transformer_Exception::TRANSFORM_IS_NOT_SUPPORTED
				);
		}
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_to(): string {
		return Tag_List_Data::class;
	}

	/**
	 * Get the tags from an object.
	 *
	 * @since $$next-version$$
	 *
	 * @param Data_Type $data The object data type we want to get the tags from.
	 * @return array The object tags as an array.
	 */
	public static function get_tags( Data_Type $data ): array {
		return $data->get_tags();
	}

	/**
	 * Transform object entity to a list of tags.
	 *
	 * @since $$next-version$$
	 *
	 * @param Data_Type $data The object data type we want to transform.
	 * @return Data_Type Return the Tag_Data of the object.
	 *
	 * @throws Data_Transformer_Exception If the object is not linked to a tag.
	 */
	public function transform( Data_Type $data ): Data_Type {

		$this->validate_from_type( $data );

		$tags = $this->get_tags( $data );

		if ( ! $tags ) {
			throw new Data_Transformer_Exception(
				'No tags are linked to the object.',
				Data_Transformer_Exception::MISSING_LINK
			);
		}

		return new Tag_List_Data( $tags );
	}
}
