<?php

class WP_Super_Cache_Rest_Debug_List extends WP_REST_Controller {

	/**
	 * Return list of debug logs
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function get_list( $request ) {
		$parameters = $request->get_json_params();

		$list = wpsc_get_debug_log_list();

		return rest_ensure_response( $list );
	}

	/**
	 * Update list of debug logs
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function update_list( $request ) {
		global $cache_path, $wp_cache_debug_log, $wp_cache_debug_username;

		$parameters = $request->get_json_params();

		$wp_cache_debug_list = wpsc_get_debug_log_list();
		if ( isset( $wp_cache_debug_list[ $parameters[ 'filename' ] ] ) ) {
			@unlink( $cache_path . $parameters[ 'filename' ] );
			if ( $wp_cache_debug_log == $parameters[ 'filename' ] ) {
				wpsc_create_debug_log( $wp_cache_debug_log, $wp_cache_debug_username );
			}
			$wp_cache_debug_list = wpsc_get_debug_log_list();
		}

		return rest_ensure_response( $wp_cache_debug_list );
	}
}
