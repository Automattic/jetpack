<?php
/**
 * Tag Data Type.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

use Automattic\Jetpack\CRM\Entities\Tag;

/**
 * Tag Data Type.
 *
 * @since $$next-version$$
 */
class Data_Type_Tag extends Data_Type_Base {

	/**
	 * {@inheritDoc}
	 */
	public static function get_slug(): string {
		return Tag::class;
	}

	/**
	 * Constructor.
	 *
	 * We process the entity data before passing it to validation.
	 * You can learn more in the "unify_data" method.
	 *
	 * @see self::unify_data()
	 *
	 * @param mixed $entity The tag entity data.
	 * @return void
	 *
	 * @throws \Automattic\Jetpack\CRM\Automation\Data_Type_Exception If the entity is not valid.
	 */
	public function __construct( $entity ) {

		if ( ! $entity instanceof Tag ) {
			$entity = new Tag( $entity );
		}
		parent::__construct( $entity );
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
	 * @param mixed $entity Tag entity data to validate.
	 * @return bool Whether the entity is valid or not.
	 */
	public function validate_entity( $entity ): bool {

		if ( $entity instanceof Tag ) {
			return true;
		}

		return false;
	}
}
