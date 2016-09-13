<?php

/**
 * Utility classes that don't necessarily have a home yet
 */

class WPCOM_JSON_API_Metadata {
	public static function is_public( $key ) {
		if ( empty( $key ) )
			return false;

		// Default whitelisted meta keys.
		$whitelisted_meta = array( '_thumbnail_id' );

		// whitelist of metadata that can be accessed
		/** This filter is documented in json-endpoints/class.wpcom-json-api-post-endpoint.php */
		if ( in_array( $key, apply_filters( 'rest_api_allowed_public_metadata', $whitelisted_meta ) ) )
			return true;

		if ( 0 === strpos( $key, 'geo_' ) )
			return true;

		if ( 0 === strpos( $key, '_wpas_' ) )
			return true;

		return false;
	}

	public static function is_internal_only( $key ) {

		if ( 0 === strpos( $key, '_jetpack_') )
			return true;

		if ( 0 === strpos( $key, '_elasticsearch_') )
			return true;

		return false;
	}
}