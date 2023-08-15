<?php
/**
 * Base Data Type class.
 *
 * @package automattic/jetpack-crm
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\CRM\Automation\Data_Types;

use Automattic\Jetpack\CRM\Automation\Data_Type_Exception;

/**
 * Abstract Data Type base class.
 *
 * @since $$next-version$$
 */
abstract class Data_Type_Base {

	/**
	 * An entity that represents an instance of the data type.
	 *
	 * @since $$next-version$$
	 *
	 * @var mixed
	 */
	protected $entity = null;

	/**
	 * Constructor.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $entity An entity that represents the data type.
	 *
	 * @throws Data_Type_Exception If the entity do not look valid.
	 */
	public function __construct( $entity ) {
		if ( ! $this->validate_entity( $entity ) ) {
			throw new Data_Type_Exception(
				sprintf( 'Invalid entity for data type: %s', static::get_slug() ),
				Data_Type_Exception::INVALID_ENTITY
			);
		}

		$this->entity = $entity;
	}

	/**
	 * Get the slug of the data type.
	 *
	 * This is meant to be unique and is used to make it easier for third
	 * parties to identify the data type in filters.
	 *
	 * Example: 'contact', 'invoice', 'order', etc.
	 *
	 * @since $$next-version$$
	 *
	 * @return string The slug of the data type.
	 */
	abstract public static function get_slug(): string;

	/**
	 * Validate the entity.
	 *
	 * This method is meant to validate if the entity has the expected inheritance
	 * or structure and will be used to throw a fatal error if not.
	 *
	 * @since $$next-version$$
	 *
	 * @param mixed $entity The entity to validate.
	 * @return bool Whether the entity is valid.
	 */
	abstract public function validate_entity( $entity ): bool;

	/**
	 * Get the entity identifier.
	 *
	 * We allow both integers AND strings as our return value since we
	 * don't know how future integrations will handle their IDs.
	 * E.g.: Stripe uses "cus_*" for customer specific IDs.
	 *
	 * @since $$next-version$$
	 *
	 * @return int|string The entity identifier value.
	 *
	 * @throws Data_Type_Exception If the entity do not look valid.
	 */
	abstract public function get_id();

	/**
	 * Get the entity.
	 *
	 * We do not know what shape this takes. It could be a class, object,
	 * or array. We leave it up to the data type to decide.
	 *
	 * @since $$next-version$$
	 *
	 * @return mixed
	 */
	public function get_entity() {
		return $this->entity;
	}

}
