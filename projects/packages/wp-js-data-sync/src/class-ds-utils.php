<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync;


class DS_Utils {

	public static function describe( $parser ) {
		// Process the top-level schema array
		$description = self::process_schema( $parser->schema() );

		// Convert the processed schema to a JSON-like string
		return wp_json_encode( $description, JSON_PRETTY_PRINT );
	}

	private static function process_schema( $item ) {
		// If the item is an associative array with 'type' as a key, return its value directly
		if ( is_array( $item ) && isset( $item['type'] ) && count( $item ) === 1 ) {
			return $item['type'];
		}

		// If the item is an associative array with 'type' and 'value', process the value
		if ( isset( $item['type'], $item['value'] ) && is_array( $item ) ) {
			return self::process_schema( $item['value'] );
		}

		// If the item is any other kind of array, process each sub-item
		if ( is_array( $item ) ) {
			$result = array();
			foreach ( $item as $key => $value ) {
				$result[ $key ] = self::process_schema( $value );
			}
			return $result;
		}
		return $item;
	}
	
}
