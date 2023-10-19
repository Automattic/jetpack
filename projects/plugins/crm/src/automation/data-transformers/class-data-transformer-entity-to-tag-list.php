<?php
/**
 * CRM Entity to CRM Tag List Transformer class.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Transformers;

use Automattic\Jetpack\CRM\Automation\Data_Transformer_Exception;
use Automattic\Jetpack\CRM\Automation\Data_Types\Data_Type;
use Automattic\Jetpack\CRM\Automation\Data_Types\Entity_Data;
use Automattic\Jetpack\CRM\Automation\Data_Types\Tag_List_Data;

/**
 * CRM Entity to CRM Tag List Transformer class.
 *
 * @since 6.2.0
 */
class Data_Transformer_Entity_To_Tag_List extends Data_Transformer_Base {

	/**
	 * {@inheritDoc}
	 */
	public static function get_slug(): string {
		return 'entity_to_tag_list';
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_from(): string {
		return Entity_Data::class;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_to(): string {
		return Tag_List_Data::class;
	}

	/**
	 * Get the tags from an CRM entity.
	 *
	 * @since 6.2.0
	 *
	 * @param Data_Type $data The CRM entity data type we want to get the tags from.
	 * @return array The CRM entity tags as an array.
	 */
	public static function get_tags( Data_Type $data ): array {
		return $data->get_tags();
	}

	/**
	 * Transform CRM entity entity to a list of tags.
	 *
	 * @since 6.2.0
	 *
	 * @param Data_Type $data The CRM entity data type we want to transform.
	 * @return Data_Type Return the Tag_Data of the CRM entity.
	 *
	 * @throws Data_Transformer_Exception If the CRM entity is not linked to a tag.
	 */
	public function transform( Data_Type $data ): Data_Type {

		$this->validate_from_type( $data );

		$tags = $this->get_tags( $data );

		return new Tag_List_Data( $tags );
	}
}
