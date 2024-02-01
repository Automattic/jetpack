<?php

class WP_Super_Cache_Rest_Get_Stats extends WP_REST_Controller {

	/**
	 * Get the cache stats for the site.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function callback( $request ) {
		global $valid_nonce;
		$_GET[ 'listfiles' ] = 1;
		$valid_nonce = true;

		return rest_ensure_response( wp_cache_regenerate_cache_file_stats() );
	}
}
