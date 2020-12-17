<?php

// @todo - nicer API for array values?

/**
 * `WP_REST_Controller` is basically a wrapper for `register_rest_route()`
 * `WPCOM_REST_API_V2_Field_Controller` is a mostly-analogous wrapper for `register_rest_field()`
 */
abstract class WPCOM_REST_API_V2_Field_Controller {
	/**
	 * @var string|string[] $object_type The REST Object Type(s) to which the field should be added.
	 */
	protected $object_type;

	/**
	 * @var string $field_name The name of the REST API field to add.
	 */
	protected $field_name;

	public function __construct() {
		if ( ! $this->object_type ) {
			/* translators: %s: object_type */
			_doing_it_wrong( 'WPCOM_REST_API_V2_Field_Controller::$object_type', sprintf( __( "Property '%s' must be overridden.", 'jetpack' ), 'object_type' ), 'Jetpack 6.8' );
			return;
		}

		if ( ! $this->field_name ) {
			/* translators: %s: field_name */
			_doing_it_wrong( 'WPCOM_REST_API_V2_Field_Controller::$field_name', sprintf( __( "Property '%s' must be overridden.", 'jetpack' ), 'field_name' ), 'Jetpack 6.8' );
			return;
		}

		add_action( 'rest_api_init', array( $this, 'register_fields' ) );

		// do this again later to collect any CPTs that get registered later
		add_action( 'restapi_theme_init', array( $this, 'register_fields' ), 20 );
	}

	/**
	 * Registers the field with the appropriate schema and callbacks.
	 */
	public function register_fields() {
		foreach ( (array) $this->object_type as $object_type ) {
			register_rest_field(
				$object_type,
				$this->field_name,
				array(
					'get_callback'    => array( $this, 'get_for_response' ),
					'update_callback' => array( $this, 'update_from_request' ),
					'schema'          => $this->get_schema(),
				)
			);
		}
	}

	/**
	 * Ensures the response matches the schema and request context.
	 *
	 * @param mixed           $value
	 * @param WP_REST_Request $request
	 * @return mixed
	 */
	private function prepare_for_response( $value, $request ) {
		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$schema  = $this->get_schema();

		$is_valid = rest_validate_value_from_schema( $value, $schema, $this->field_name );
		if ( is_wp_error( $is_valid ) ) {
			return $is_valid;
		}

		return $this->filter_response_by_context( $value, $schema, $context );
	}

	/**
	 * Returns the schema's default value
	 *
	 * If there is no default, returns the type's falsey value.
	 *
	 * @param array $schema
	 * @return mixed
	 */
	final public function get_default_value( $schema ) {
		if ( isset( $schema['default'] ) ) {
			return $schema['default'];
		}

		// If you have something more complicated, use $schema['default'];
		switch ( isset( $schema['type'] ) ? $schema['type'] : 'null' ) {
			case 'string':
				return '';
			case 'integer':
			case 'number':
				return 0;
			case 'object':
				return (object) array();
			case 'array':
				return array();
			case 'boolean':
				return false;
			case 'null':
			default:
				return null;
		}
	}

	/**
	 * The field's wrapped getter. Does permission checks and output preparation.
	 *
	 * This cannot be extended: implement `->get()` instead.
	 *
	 * @param mixed           $object_data Probably an array. Whatever the endpoint returns.
	 * @param string          $field_name Should always match `->field_name`
	 * @param WP_REST_Request $request
	 * @param string          $object_type Should always match `->object_type`
	 * @return mixed
	 */
	final public function get_for_response( $object_data, $field_name, $request, $object_type ) {
		$permission_check = $this->get_permission_check( $object_data, $request );

		if ( ! $permission_check ) {
			/* translators: %s: get_permission_check() */
			_doing_it_wrong( 'WPCOM_REST_API_V2_Field_Controller::get_permission_check', sprintf( __( "Method '%s' must return either true or WP_Error.", 'jetpack' ), 'get_permission_check' ), 'Jetpack 6.8' );
			return $this->get_default_value( $this->get_schema() );
		}

		if ( is_wp_error( $permission_check ) ) {
			return $this->get_default_value( $this->get_schema() );
		}

		$value = $this->get( $object_data, $request );

		return $this->prepare_for_response( $value, $request );
	}

	/**
	 * The field's wrapped setter. Does permission checks.
	 *
	 * This cannot be extended: implement `->update()` instead.
	 *
	 * @param mixed           $value The new value for the field.
	 * @param mixed           $object_data Probably a WordPress object (e.g., WP_Post)
	 * @param string          $field_name Should always match `->field_name`
	 * @param WP_REST_Request $request
	 * @param string          $object_type Should always match `->object_type`
	 * @return void|WP_Error
	 */
	final public function update_from_request( $value, $object_data, $field_name, $request, $object_type ) {
		$permission_check = $this->update_permission_check( $value, $object_data, $request );

		if ( ! $permission_check ) {
			/* translators: %s: update_permission_check() */
			_doing_it_wrong( 'WPCOM_REST_API_V2_Field_Controller::update_permission_check', sprintf( __( "Method '%s' must return either true or WP_Error.", 'jetpack' ), 'update_permission_check' ), 'Jetpack 6.8' );
			/* translators: %s: the name of an API response field */
			return new WP_Error( 'invalid_user_permission', sprintf( __( "You are not allowed to access the '%s' field.", 'jetpack' ), $this->field_name ) );
		}

		if ( is_wp_error( $permission_check ) ) {
			return $permission_check;
		}

		$updated = $this->update( $value, $object_data, $request );

		if ( is_wp_error( $updated ) ) {
			return $updated;
		}
	}

	/**
	 * Permission Check for the field's getter. Must be implemented in the inheriting class.
	 *
	 * @param mixed           $object_data Whatever the endpoint would return for its response.
	 * @param WP_REST_Request $request
	 * @return true|WP_Error
	 */
	public function get_permission_check( $object_data, $request ) {
		/* translators: %s: get_permission_check() */
		_doing_it_wrong( 'WPCOM_REST_API_V2_Field_Controller::get_permission_check', sprintf( __( "Method '%s' must be overridden.", 'jetpack' ), __METHOD__ ), 'Jetpack 6.8' );
	}

	/**
	 * The field's "raw" getter. Must be implemented in the inheriting class.
	 *
	 * @param mixed           $object_data Whatever the endpoint would return for its response.
	 * @param WP_REST_Request $request
	 * @return mixed
	 */
	public function get( $object_data, $request ) {
		/* translators: %s: get() */
		_doing_it_wrong( 'WPCOM_REST_API_V2_Field_Controller::get', sprintf( __( "Method '%s' must be overridden.", 'jetpack' ), __METHOD__ ), 'Jetpack 6.8' );
	}

	/**
	 * Permission Check for the field's setter. Must be implemented in the inheriting class.
	 *
	 * @param mixed           $value The new value for the field.
	 * @param mixed           $object_data Probably a WordPress object (e.g., WP_Post)
	 * @param WP_REST_Request $request
	 * @return true|WP_Error
	 */
	public function update_permission_check( $value, $object_data, $request ) {
		/* translators: %s: update_permission_check() */
		_doing_it_wrong( 'WPCOM_REST_API_V2_Field_Controller::update_permission_check', sprintf( __( "Method '%s' must be overridden.", 'jetpack' ), __METHOD__ ), 'Jetpack 6.8' );
	}

	/**
	 * The field's "raw" setter. Must be implemented in the inheriting class.
	 *
	 * @param mixed           $value The new value for the field.
	 * @param mixed           $object_data Probably a WordPress object (e.g., WP_Post)
	 * @param WP_REST_Request $request
	 * @return mixed
	 */
	public function update( $value, $object_data, $request ) {
		/* translators: %s: update() */
		_doing_it_wrong( 'WPCOM_REST_API_V2_Field_Controller::update', sprintf( __( "Method '%s' must be overridden.", 'jetpack' ), __METHOD__ ), 'Jetpack 6.8' );
	}

	/**
	 * The JSON Schema for the field
	 *
	 * @link https://json-schema.org/understanding-json-schema/
	 * As of WordPress 5.0, Core currently understands:
	 * * type
	 *   * string - not minLength, not maxLength, not pattern
	 *   * integer - minimum, maximum, exclusiveMinimum, exclusiveMaximum, not multipleOf
	 *   * number  - minimum, maximum, exclusiveMinimum, exclusiveMaximum, not multipleOf
	 *   * boolean
	 *   * null
	 *   * object - properties, additionalProperties, not propertyNames, not dependencies, not patternProperties, not required
	 *   * array: only lists, not tuples - items, not minItems, not maxItems, not uniqueItems, not contains
	 * * enum
	 * * format
	 *   * date-time
	 *   * email
	 *   * ip
	 *   * uri
	 * As of WordPress 5.0, Core does not support:
	 * * Multiple type: `type: [ 'string', 'integer' ]`
	 * * $ref, allOf, anyOf, oneOf, not, const
	 *
	 * @return array
	 */
	public function get_schema() {
		/* translators: %s: get_schema() */
		_doing_it_wrong( 'WPCOM_REST_API_V2_Field_Controller::get_schema', sprintf( __( "Method '%s' must be overridden.", 'jetpack' ), __METHOD__ ), 'Jetpack 6.8' );
	}

	/**
	 * @param array  $schema
	 * @param string $context REST API Request context
	 * @return bool
	 */
	private function is_valid_for_context( $schema, $context ) {
		return empty( $schema['context'] ) || in_array( $context, $schema['context'], true );
	}

	/**
	 * Removes properties that should not appear in the current
	 * request's context
	 *
	 * $context is a Core REST API Framework request attribute that is
	 * always one of:
	 * * view (what you see on the blog)
	 * * edit (what you see in an editor)
	 * * embed (what you see in, e.g., an oembed)
	 *
	 * Fields (and sub-fields, and sub-sub-...) can be flagged for a
	 * set of specific contexts via the field's schema.
	 *
	 * The Core API will filter out top-level fields with the wrong
	 * context, but will not recurse deeply enough into arrays/objects
	 * to remove all levels of sub-fields with the wrong context.
	 *
	 * This function handles that recursion.
	 *
	 * @param mixed  $value
	 * @param array  $schema
	 * @param string $context REST API Request context
	 * @return mixed Filtered $value
	 */
	final public function filter_response_by_context( $value, $schema, $context ) {
		if ( ! $this->is_valid_for_context( $schema, $context ) ) {
			// We use this intentionally odd looking WP_Error object
			// internally only in this recursive function (see below
			// in the `object` case). It will never be output by the REST API.
			// If we return this for the top level object, Core
			// correctly remove the top level object from the response
			// for us.
			return new WP_Error( '__wrong-context__' );
		}

		switch ( $schema['type'] ) {
			case 'array':
				if ( ! isset( $schema['items'] ) ) {
					return $value;
				}

				// Shortcircuit if we know none of the items are valid for this context.
				// This would only happen in a strangely written schema.
				if ( ! $this->is_valid_for_context( $schema['items'], $context ) ) {
					return array();
				}

				// Recurse to prune sub-properties of each item.
				foreach ( $value as $key => $item ) {
					$value[ $key ] = $this->filter_response_by_context( $item, $schema['items'], $context );
				}

				return $value;
			case 'object':
				if ( ! isset( $schema['properties'] ) ) {
					return $value;
				}

				foreach ( $value as $field_name => $field_value ) {
					if ( isset( $schema['properties'][ $field_name ] ) ) {
						$field_value = $this->filter_response_by_context( $field_value, $schema['properties'][ $field_name ], $context );
						if ( is_wp_error( $field_value ) && '__wrong-context__' === $field_value->get_error_code() ) {
							unset( $value[ $field_name ] );
						} else {
							// Respect recursion that pruned sub-properties of each property.
							$value[ $field_name ] = $field_value;
						}
					}
				}

				return (object) $value;
		}

		return $value;
	}
}
