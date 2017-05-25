<?php

class WP_Super_Cache_Rest_Delete_Cache extends WP_REST_Controller {

	/**
	 * Get a collection of items
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function callback( $request ) {
		$params = $request->get_json_params();

		if ( isset( $params['id'] ) && is_numeric( $params['id'] ) ) {
			wpsc_delete_post_cache( $params['id'] );

		} elseif ( !empty( $params['expired'] ) ) {
			global $file_prefix;
			wp_cache_clean_expired( $file_prefix );

		} elseif ( isset( $params['url'] ) ) {
			global $cache_path;

			$directory = $cache_path . 'supercache/' . $params[ 'url' ];
			wpsc_delete_files( $directory );
			prune_super_cache( $directory . '/page', true );

		} else {
			global $file_prefix;
			wp_cache_clean_cache( $file_prefix, !empty( $params['all'] ) );
		}

		return rest_ensure_response( array( 'Cache Cleared' => true ) );
	}
}
