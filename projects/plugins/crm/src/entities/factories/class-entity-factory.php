<?php
/**
 * Base Entity Factory.
 *
 * @package automattic/jetpack-crm
 */

namespace Automattic\Jetpack\CRM\Entities\Factories;

/**
 * Base Entity Factory.
 *
 * @since $$next-version$$
 */
abstract class Entity_Factory {

	/**
	 * Create the instance of the class based on the data from DAL.
	 *
	 * @param array $data The data to create the instance with.
	 *
	 * @return mixed The entity instance.
	 */
	abstract public static function create( array $data );

	/**
	 * Create the entity instance from a generic/tidy data array.
	 *
	 * @param array $tidy_data An array with the tidy data from DAL.
	 *
	 * @return mixed The entity instance.
	 * @throws Factory_Exception If the entity class is invalid.
	 */
	protected static function create_from_tidy_data( array $tidy_data ) {

		$entity = self::entity_new_instance();

		$fields_map = static::get_fields_map();

		// Process primary fields
		foreach ( $tidy_data as $field => $value ) {
			if ( in_array( $field, $fields_map, true ) ) {
				$entity->{ $field } = $value;
			}
		}

		$associative_field_map = static::get_associative_field_map();

		// Process associative fields
		foreach ( $associative_field_map as $field ) {
			if ( array_key_exists( $field, $tidy_data ) ) {
				$entity->{ $field } = $tidy_data[ $field ];
			}
		}

		return $entity;
	}

	/**
	 * Create the entity instance from the database data array.
	 *
	 * @param array $db_data The data array from the database.
	 *
	 * @return mixed The entity instance.
	 * @throws Factory_Exception If the entity class is invalid.
	 */
	protected static function create_from_db( array $db_data ) {
		$entity = self::entity_new_instance();

		$fields_map = static::get_fields_map();

		foreach ( $db_data as $key => $value ) {
			if ( array_key_exists( $key, $fields_map ) ) {
				$entity->{ $fields_map[ $key ] } = $value;
			}
		}

		return $entity;
	}

	/**
	 * Get the data (tidy) as an array from the entity instance.
	 *
	 * @param mixed $entity The entity instance.
	 *
	 * @return array The tidy data array.
	 * @throws Factory_Exception If the entity class is invalid.
	 */
	public static function tidy_data( $entity ): array {

		$entity_class = static::get_entity_class();

		if ( ! $entity instanceof $entity_class ) {
			throw new Factory_Exception( 'Invalid entity instance provided.', Factory_Exception::INVALID_ENTITY_CLASS );
		}

		$fields_map = static::get_fields_map();

		$tidy_data = array();
		foreach ( $fields_map as $value ) {
			$tidy_data[ $value ] = $entity->{ $value };
		}

		return $tidy_data;
	}

	/**
	 * Get the data from the entity instance as an array ready for the database.
	 *
	 * @param mixed $entity The entity instance.
	 * @return array The data array for the DAL.
	 */
	public static function data_for_db( $entity ): array {
		$db_input_data = array(
			'id'    => $entity->id,
			'owner' => $entity->owner,
			'data'  => array(),
		);

		$skip_fields = array( 'id', 'owner' );

		$fields_map = static::get_fields_map();

		foreach ( $fields_map as $entity_field ) {
			if ( in_array( $entity_field, $skip_fields, true ) ) {
				continue;
			}
			$db_input_data['data'][ $entity_field ] = $entity->{ $entity_field };
		}
		return $db_input_data;
	}

	/**
	 * Create an empty entity instance.
	 *
	 * @return mixed The entity instance.
	 * @throws Factory_Exception If the entity class is invalid.
	 */
	protected static function entity_new_instance() {
		$entity_class = static::get_entity_class();

		if ( class_exists( $entity_class ) ) {
			return new $entity_class();
		} else {
			throw new Factory_Exception( 'Invalid entity class provided.', Factory_Exception::INVALID_ENTITY_CLASS );
		}
	}

	/**
	 * Return the fields map.
	 *
	 * 'db_column' => 'entity_property'
	 *
	 * @return array The fields map.
	 */
	public static function get_fields_map(): array {
		return array();
	}

	/**
	 * Return the associative fields map.
	 *
	 * tags, files, etc.
	 *
	 * @return array The associative fields map.
	 */
	abstract public static function get_associative_field_map(): array;

	/**
	 * Return the entity class handle by the Factory.
	 *
	 * @return string|null The entity class.
	 */
	abstract public static function get_entity_class(): ?string;
}
