<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Schema\Parser;

class DS_Utils {

	/**
	 * The schema generated by the parser can be very verbose and hard to read.
	 * This is a helper utility that converts the schema into a more human-readable format.
	 *
	 * @param Parser $parser The parser instance.
	 *                       This is the same parser instance that was used to generate the schema.
	 *                       It is used to convert the schema into a human-readable format.
	 * @param bool   $encode Whether to encode the schema as a JSON string.
	 *
	 * @return array|string
	 */
	public static function describe( Parser $parser, $encode = false ) {
		// Process the top-level schema array
		$description = self::human_readable_schema( $parser->schema() );

		if ( $encode === true ) {
			return $description;
		}
		// Convert the processed schema to a JSON-like string
		return wp_json_encode( $description, JSON_PRETTY_PRINT );
	}

	/**
	 * Recursive function that will crawl through the schema,
	 * and call on itself to process each sub-item.
	 *
	 * @param mixed $item The item to process.
	 *
	 * @return mixed The processed item.
	 */
	private static function human_readable_schema( $item ) {
		// If the item is an associative array with 'type' as a key, return its value directly
		if ( is_array( $item ) && isset( $item['type'] ) && count( $item ) === 1 ) {
			return $item['type'];
		}

		// If the item is an associative array with 'type' and 'value', process the value
		if ( isset( $item['type'], $item['value'] ) && is_array( $item ) ) {
			return self::human_readable_schema( $item['value'] );
		}

		// If the item is any other kind of array, process each sub-item
		if ( is_array( $item ) ) {
			$result = array();
			foreach ( $item as $key => $value ) {
				$result[ $key ] = self::human_readable_schema( $value );
			}
			return $result;
		}
		return $item;
	}
}
