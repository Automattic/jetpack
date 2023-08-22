<?php
/**
 * Quote Data Type.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

/**
 * Quote Data Type.
 *
 * @since $$next-version$$
 */
class Data_Type_Quote extends Data_Type_Base {

	/**
	 * Constructor.
	 *
	 * We process the entity data before passing it to validation.
	 * You can learn more in the "unify_data" method.
	 *
	 * @see self::unify_data()
	 *
	 * @param mixed $entity The quote entity data.
	 * @return void
	 *
	 * @throws \Automattic\Jetpack\CRM\Automation\Data_Type_Exception If the entity is not valid.
	 */
	public function __construct( $entity ) {
		$entity = $this->unify_data( $entity );

		parent::__construct( $entity );
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_slug(): string {
		return 'quote';
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
	 * @param mixed $entity Quote entity data to validate.
	 * @return bool Whether the entity is valid or not.
	 */
	public function validate_entity( $entity ): bool {
		if ( ! is_array( $entity ) ) {
			return false;
		}

		$required_fields = array(
			'id',
			'accepted',
			'template',
			'title',
		);

		foreach ( $required_fields as $field ) {
			if ( ! isset( $entity[ $field ] ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Unify how CRM quote data is formatted.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $entity The data we want to potentially prepare.
	 * @return array|mixed The unified data.
	 */
	public function unify_data( $entity ) {
		if ( ! is_array( $entity ) ) {
			return $entity;
		}

		if ( ! isset( $entity['zbsq_accepted'] ) ) {
			return $entity;
		}

		$quotes_dal = new \zbsDAL_quotes();
		return $quotes_dal->tidy_quote( (object) $entity );
	}
}
