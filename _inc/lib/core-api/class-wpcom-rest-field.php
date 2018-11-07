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

		register_rest_field( 'post', 'jetpack_publicize_connections', array(
			'get_callback' => array( $this, 'get_for_response' ),
			'update_callback' => array( $this, 'update_from_request' ),
			'schema' => $this->get_schema(),
		) );
	}

	function prepare_for_response( $value, $request ) {
		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$schema = $this->get_schema();

		$validated = $this->validate( $value, $schema );
		return $this->filter_response_by_context( $validated, $schema, $context );
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

		$new_value = $this->update( $value, $object_data, $request );

		$this->prepare_for_response( $new_value, $request );
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

	public function validate( $value, $schema ) {
		switch ( $schema['type'] ) {
		case 'integer' :
			return (int) $value;
		case 'number' :
			return (float) $value;
		case 'string' :
			return (string) $value;
		case 'boolean' :
			return (bool) $value;
		case 'null' :
			return null;
		case 'array' :
			$value = (array) $value;
			if ( ! isset( $schema['items'] ) ) {
				return $value;				
			}

			$keys = array_keys( $value );

			if ( isset( $schema['items'][0] ) ) {
				// tuple
				$items = array_map( array( $this, 'validate' ), $value, $schema['items'] );
			} else {
				// list
				$items = array_map( array( $this, 'validate' ), $value, array_fill( 0, count( $keys ), $schema['items'] ) );
			}

			return array_combine( $keys, $items );
		case 'object' :
			$value = is_object( $value ) ? get_object_vars( $value ) : (array) $value;
			$output = array();

			if ( isset( $schema['properties'] ) ) {
				foreach ( $schema['properties'] as $field_name => $field_schema ) {
					if ( isset( $value[$field_name] ) ) {
						$output[$field_name] = $this->validate( $value[$field_name], $field_schema );
						unset( $value[$field_name] );
					}
				}
			}

			if ( isset( $schema['patternProperties'] ) ) {
				foreach ( $value as $field_name => $field_value ) {
					foreach ( $schema['patternProperties'] as $pattern => $pattern_schema ) {
						if ( preg_match( "/$pattern/", $field_name ) ) {
							$value[$field_name] = $this->validate( $field_value, $pattern_schema );
						}
					}
				}
			}

			$output += $value;

			return $output;
		}
	}

	function filter_response_by_context( $value, $schema, $context ) {
		if ( empty( $schema['context'] ) ) {
			return $value;
		}

		if ( ! in_array( $context, $schema['context'], true ) ) {
			// The Core REST API code will remove the root
			// property if the cotext doesn't match
			// For sub-properties, we filter them out later
			// using this hack.
			return new WP_Error( '__wrong-context__' );
		}

		switch ( $schema['type'] ) {
		case 'integer' :
		case 'number' :
		case 'string' :
		case 'boolean' :
		case 'null' :
			return $value;
		case 'array' :
			if ( ! isset( $schema['items'] ) ) {
				return $value;				
			}

			$keys = array_keys( $value );

			if ( isset( $schema['items'][0] ) ) {
				// tuple
				$items = array_map(
					array( $this, 'filter_response_by_context' ),
					$value,
					$schema['items'],
					array_fill( 0, count( $keys ), $context )
				);

				// It doesn't make sense for tuples to have one item with one context and another with another.
				// Instead, we depend on the context details for the propertie one level up.
				// (We still do the array_map above, though, so that sub-properties of the tuple's items will
				// have their contexts processed.)
				return array_combine( $keys, $items );
			}

			// else: list
			$items = array_map(
				array( $this, 'filter_response_by_context' ),
				$value,
				array_fill( 0, count( $keys ), $schema['items'] ),
				array_fill( 0, count( $keys ), $context )
			);

			$value = array_combine( $keys, $items );

			foreach ( $value as $key => $item ) {
				if ( is_wp_error( $item ) && '__wrong-context__' === $item->get_error_code() ) {
					unset( $value[$key] );
				}
			}

			return $value;
		case 'object' :
			$output = array();

			if ( isset( $schema['properties'] ) ) {
				foreach ( $value as $field_name => $field_value ) {
					if ( isset( $schema['properties'][$field_name] ) ) {
						$field_value = $this->filter_response_by_context( $field_value, $schema['properties'][$field_name], $context );
						if ( ! is_wp_error( $field_value ) || '__wrong-context__' !== $field_value->get_error_code() ) {
							$output[$field_name] = $field_value;
						}
						unset( $value[$field_name] );
					}
				}
			}

			if ( isset( $schema['patternProperties'] ) ) {
				foreach ( $schema['patternProperties'] as $pattern => $pattern_schema ) {
					foreach ( $value as $field_name => $field_value ) {
						if ( preg_match( "/$pattern/", $field_name ) ) {
							$field_value = $this->filter_response_by_context( $field_value, $pattern_schema, $context );
							if ( is_wp_error( $field_value ) && '__wrong-context__' === $field_value->get_error_code() ) {
								unset( $value[$field_name] );
							} else {
								$value[$field_name] = $field_value;
							}
						}
					}
				}
			}

			$output += $value;

			return (object) $output;
		}
	}
}
