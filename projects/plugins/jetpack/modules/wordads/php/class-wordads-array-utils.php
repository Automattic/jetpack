<?php
/**
 * A utility class that provides functionality for manipulating arrays.
 *
 * @package automattic/jetpack
 */

/**
 * WordAds_Array_Utils Class.
 */
final class WordAds_Array_Utils {

	/**
	 * Converts a (potentially nested) array to a JavaScript object.
	 *
	 * Note: JS code strings should be prefixed with 'js:'.
	 *
	 * @param array $value The array to convert to a JavaScript object.
	 * @param bool  $in_list True if we are processing an inner list (non-associative array).
	 *
	 * @return string String representation of the JavaScript object
	 */
	public static function array_to_js_object( array $value, bool $in_list = false ): string {
		$properties = array();

		foreach ( $value as $k => $v ) {
			// Don't set property key for values from non-associative array.
			$property_key = $in_list ? '' : "'$k': ";

			if ( is_array( $v ) ) {
				// Check for empty array.
				if ( array() === $v ) {
					$properties[] = "'$k': []";
					continue;
				}

				// Check if this is a list and not an associative array.
				if ( array_keys( $v ) === range( 0, count( $v ) - 1 ) ) {
					// Apply recursively.
					$properties[] = $property_key . '[ ' . self::array_to_js_object( $v, true ) . ' ]';
				} else {
					// Apply recursively.
					$properties[] = $property_key . self::array_to_js_object( $v );
				}
			} elseif ( is_string( $v ) && strpos( $v, 'js:' ) === 0 ) {
				// JS code. Strip the 'js:' prefix.
				$properties[] = $property_key . substr( $v, 3 );
			} elseif ( is_string( $v ) ) {
				$properties[] = $property_key . "'" . addcslashes( $v, "'" ) . "'";
			} elseif ( is_bool( $v ) ) {
				$properties[] = $property_key . ( $v ? 'true' : 'false' );
			} elseif ( $v === null ) {
				$properties[] = $property_key . 'null';
			} else {
				$properties[] = $property_key . $v;
			}
		}

		$output = implode( ', ', $properties );

		if ( ! $in_list ) {
			$output = '{ ' . $output . ' }';
		}

		return $output;
	}
}
