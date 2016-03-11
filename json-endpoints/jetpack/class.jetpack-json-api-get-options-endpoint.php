<?php

class Jetpack_JSON_API_Get_Options_Endpoint extends Jetpack_JSON_API_Endpoint {

	protected $needed_capabilities = 'manage_options';

	static $options = array(
		'blogname' => 'string'
	);

	/**
	 * Data that we want to sync.
	 * @var array
	 */
	static $mock_options = array(
		'admin_url' => array(
			'type' => 'url',
			'callback' => 'get_admin_url'
		)
	);


	function result() {
		$args = $this->query_args();
		$data = array();
		if ( isset( $args['options'] ) && is_array( $args['options'] ) ) {
			$all_settings = $args['options'];
		} else {
			$type = isset( $args['options'] ) ? $args['options'] : 'all';
			switch( $type ) {
				case 'options':
					$all_settings = array_keys( self::$options );
					break;
				case 'mock_options':
					$all_settings = array_keys( self::$mock_options );
					break;
				case 'all':
				default:
					$all_settings = array_merge( array_keys( self::$options ), array_keys( self::$mock_options ), array_keys( self::$constants ) );
					break;
			}
		}
		foreach ( $all_settings as $name  ) {
			$data[ $name ] = self::get( $name );
		}
		return array( 'options' => $data );
	}

	/**
	 * Get individual setting
	 *
	 * @param  sting $name
	 * @param  string $type
	 * @param  string or array $callback
	 * @param  boolean $is_constant
	 * @return value of the setting
	 */
	static function get( $name ) {
		// Options
		if ( array_key_exists( $name, self::$options ) ) {
			return self::validate_option( get_option( $name ), self::$options[ $name ] );
			// Mock options
		} elseif ( array_key_exists( $name, self::$mock_options ) ) {
			if ( is_callable( self::$mock_options[ $name ][ 'callback' ] ) ) {
				$args = array();
				if ( isset( self::$mock_options[ $name ][ 'callback_args' ] ) &&
				     is_array( self::$mock_options[ $name ][ 'callback_args' ] ) ) {
					$args = self::$mock_options[ $name ][ 'callback_args' ];
				}
				$data = call_user_func_array( self::$mock_options[ $name ][ 'callback' ], $args );
				return self::validate_option( $data, self::$mock_options[ $name ][ 'type' ] );
			} else {
				return new WP_Error( json_encode( self::$mock_options[ $name ][ 'callback' ] ) . ' can not be called' );
			}
		}
		return null;
	}

	static function validate( $data, $type = null ) {
		if ( is_null( $data ) ) {
			return $data;
		}
		switch( $type ) {
			case 'bool':
				return boolval( $data );
			case 'url':
				return esc_url( $data );
			case 'on':
				return ( 'on' == $data ? true : false );
				break;
			case 'closed':
				return ( 'closed' != $data ? true : false );
			case 'string':
				return strval( $data );
			case 'int':
				return ( is_numeric( $data ) ? intval( $data ) : 0 );
			case 'float':
				return ( is_numeric( $data ) ? floatval( $data ) : 0 );
			case 'array':
				return ( is_array( $data ) ? $data : array() );
			case 'rtrim-slash':
				return strval( rtrim( $data, '/' ) );
		}
		if (  is_string( $type ) && 'regex:' == substr( $type, 0, 6 ) ) {
			return ( preg_match( substr( $type, 6 ), $data ) ? $data : null );
		} elseif ( is_array( $type ) ) {
			// Is the array associative?
			if ( count( array_filter( array_keys( $type ), 'is_string' ) ) ) {
				foreach ( $type as $item => $check ) {
					$data[ $item ] = self::validate( $data[ $item ], $check );
				}
				return $data;
			} else {
				// check if the value exists in the array if not return the first value.
				// Ex $type = array( 'open', 'closed' ); defaults to 'open'
				return ( in_array( $data, $type ) ? $data: $type[0] );
			}
		}
		// Don't check for validity here
		if ( 'no-validation' == $type ) {
			return $data;
		}
		return null;
	}

	static function validate_option( $data, $type = null ) {
		if ( is_null( $data ) ) {
			return $data;
		}
		switch( $type ) {
			case 'bool':
				return boolval( $data );
			case 'url':
				return esc_url( $data );
			case 'on':
				return ( 'on' == $data ? true : false );
				break;
			case 'closed':
				return ( 'closed' != $data ? true : false );
			case 'string':
				return strval( $data );
			case 'int':
				return ( is_numeric( $data ) ? intval( $data ) : 0 );
			case 'float':
				return ( is_numeric( $data ) ? floatval( $data ) : 0 );
			case 'array':
				return ( is_array( $data ) ? $data : array() );
			case 'rtrim-slash':
				return strval( rtrim( $data, '/' ) );
		}
		if (  is_string( $type ) && 'regex:' == substr( $type, 0, 6 ) ) {
			return ( preg_match( substr( $type, 6 ), $data ) ? $data : null );
		} elseif ( is_array( $type ) ) {
			// Is the array associative?
			if ( count( array_filter( array_keys( $type ), 'is_string' ) ) ) {
				foreach ( $type as $item => $check ) {
					$data[ $item ] = self::validate( $data[ $item ], $check );
				}
				return $data;
			} else {
				// check if the value exists in the array if not return the first value.
				// Ex $type = array( 'open', 'closed' ); defaults to 'open'
				return ( in_array( $data, $type ) ? $data: $type[0] );
			}
		}
		// Don't check for validity here
		if ( 'no-validation' == $type ) {
			return $data;
		}
		return null;
	}
}
