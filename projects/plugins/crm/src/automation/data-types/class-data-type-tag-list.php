<?php
/**
 * Tag_List Data Type.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

use Automattic\Jetpack\CRM\Automation\Data_Type_Exception;
use Automattic\Jetpack\CRM\Entities\Tag;

/**
 * Tag_List Data Type.
 *
 * @since $$next-version$$
 */
class Data_Type_Tag_List extends Data_Type_Base {

	/**
	 * {@inheritDoc}
	 */
	public static function get_slug(): string {
		return 'Tag_List::class';
	}

	/**
	 * Constructor.
	 *
	 * We process the entity data before passing it to validation.
	 *
	 * @param mixed $entity_list The tag list data.
	 * @return void
	 *
	 * @throws \Automattic\Jetpack\CRM\Automation\Data_Type_Exception If the entity is not valid.
	 */
	public function __construct( $entity_list ) {

		if ( ! is_array( $entity_list ) ) {
			throw new Data_Type_Exception(
				sprintf( 'Invalid tag entity', static::get_slug() ),
				Data_Type_Exception::INVALID_ENTITY
			);
		}

		foreach ( $entity_list as $entity ) {

			if ( ! $entity instanceof Tag ) {
				$entity = new Tag( $entity );
			}
			parent::__construct( $entity );

		}
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_id() {
		return $this->entity['id'];
	}

	/**
	 * Validate entity data.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $entity_list Tag List entity data to validate.
	 * @return bool Whether the entity is valid or not.
	 *
	 * @throws \Automattic\Jetpack\CRM\Automation\Data_Type_Exception If the entity is not valid.
	 */
	public function validate_entity( $entity_list ): bool {

		if ( ! is_array( $entity_list ) || empty( $entity_list ) ) {
			throw new Data_Type_Exception(
				sprintf( 'Invalid tag entity', static::get_slug() ),
				Data_Type_Exception::INVALID_ENTITY
			);
		}

		foreach ( $entity_list as $entity ) {
			if ( ! $entity instanceof Tag ) {
				return false;
			}
		}

		return true;
	}
}
