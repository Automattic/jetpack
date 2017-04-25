<?php

class WP_Super_Cache_Rest_Get_Stats extends WP_REST_Controller {

	/**
	 * Get the cache stats for the site.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function callback( $request ) {
		$sizes = wpsc_generate_sizes_array();
		$supercachedir = get_supercache_dir();

		return rest_ensure_response( wpsc_dirsize( $supercachedir, $sizes ) );
	}
}
