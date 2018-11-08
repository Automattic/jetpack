<?php

/**
 * @todo - nicer API for array values
 */
abstract class WPCOM_REST_API_V2_Field_Controller {
	protected $object_type;
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

		register_rest_field( $this->object_type, $this->field_name, array(
			'get_callback' => array( $this, 'get_for_response' ),
			'update_callback' => array( $this, 'update_from_request' ),
			'schema' => $this->get_schema(),
		) );
	}

	function prepare_for_response( $value, $request ) {
		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$schema = $this->get_schema();

		$is_valid = rest_validate_value_from_schema( $value, $schema, $this->field_name );
		if ( is_wp_error( $is_valid ) ) {
			return $is_valid;
		}

		return $this->filter_response_by_context( $value, $schema, $context );
	}

	public function get_for_response( $object_data, $field_name, $request, $object_type ) {
		$permission_check = $this->get_permission_check( $request );

		if ( ! $permission_check || is_wp_error( $permission_check ) ) {
			return;
		}

		$value = $this->get( $object_data, $request );

		return $this->prepare_for_response( $value, $request );
	}

	public function update_from_request( $value, $object_data, $field_name, $request, $object_type ) {
		$permission_check = $this->update_permission_check( $value, $request );

		if ( ! $permission_check ) {
			return;
		}

		if ( is_wp_error( $permission_check ) ) {
			return $permission_check;
		}

		$updated = $this->update( $value, $object_data, $request );

		if ( is_wp_error( $updated ) ) {
			return $updated;
		}
	}

	public function get_permission_check( $request ) {
		/* translators: %s: get_permission_check() */
                _doing_it_wrong( 'WPCOM_REST_API_V2_Field_Controller::get_permission_check', sprintf( __( "Method '%s' must be overridden." ), __METHOD__ ), 'Jetpack 6.8' );
	}

	public function get( $object_data, $request ) {
		/* translators: %s: get() */
                _doing_it_wrong( 'WPCOM_REST_API_V2_Field_Controller::get', sprintf( __( "Method '%s' must be overridden." ), __METHOD__ ), 'Jetpack 6.8' );
	}

	public function update_permission_check( $value, $request ) {
		/* translators: %s: update_permission_check() */
                _doing_it_wrong( 'WPCOM_REST_API_V2_Field_Controller::update_permission_check', sprintf( __( "Method '%s' must be overridden." ), __METHOD__ ), 'Jetpack 6.8' );
	}

	public function update( $value, $object_data, $request ) {
		/* translators: %s: update() */
                _doing_it_wrong( 'WPCOM_REST_API_V2_Field_Controller::update', sprintf( __( "Method '%s' must be overridden." ), __METHOD__ ), 'Jetpack 6.8' );
	}

	public function get_schema() {
		/* translators: %s: get_schema() */
                _doing_it_wrong( 'WPCOM_REST_API_V2_Field_Controller::get_schema', sprintf( __( "Method '%s' must be overridden." ), __METHOD__ ), 'Jetpack 6.8' );
	}

	function is_valid_for_context( $schema, $context ) {
		return empty( $schema['context'] ) || in_array( $context, $schema['context'], true );
	}

	function filter_response_by_context( $value, $schema, $context ) {
		if ( ! $this->is_valid_for_context( $schema, $context ) ) {
			return new WP_Error( '__wrong-context__' );
		}

		switch ( $schema['type'] ) {
		case 'array' :
			if ( ! isset( $schema['items'] ) ) {
				return $value;
			}

			// Shortcircuit if we know none of the items are valid for this context.
			// This would only happen in a strangely written schema.
			if ( ! $this->is_valid_for_context( $schema['items'], $context ) ) {
				return array();
			}

			// Recurse to prune sub-properties of each item.

			$keys = array_keys( $value );

			$items = array_map(
				array( $this, 'filter_response_by_context' ),
				$value,
				array_fill( 0, count( $keys ), $schema['items'] ),
				array_fill( 0, count( $keys ), $context )
			);

			return array_combine( $keys, $items );
		case 'object' :
			if ( ! isset( $schema['properties'] ) ) {
				return $value;
			}

			foreach ( $value as $field_name => $field_value ) {
				if ( isset( $schema['properties'][$field_name] ) ) {
					$field_value = $this->filter_response_by_context( $field_value, $schema['properties'][$field_name], $context );
					if ( is_wp_error( $field_value ) && '__wrong-context__' === $field_value->get_error_code() ) {
						unset( $value[$field_name] );
					} else {
						// Respect recursion that pruned sub-properties of each property.
						$value[$field_name] = $field_value;
					}
				}
			}

			return (object) $value;
		}

		return $value;
	}
}
