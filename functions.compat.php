<?php

if ( !function_exists( 'rawurlencode_deep' ) ) :
/**
 * Navigates through an array and raw encodes the values to be used in a URL.
 *
 * @since WordPress 3.4.0
 *
 * @param array|string $value The array or string to be encoded.
 * @return array|string $value The encoded array (or string from the callback).
 */
function rawurlencode_deep( $value ) {
	return is_array( $value ) ? array_map( 'rawurlencode_deep', $value ) : rawurlencode( $value );
}
endif;
