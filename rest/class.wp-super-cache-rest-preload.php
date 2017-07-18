<?php

class WP_Super_Cache_Rest_Preload extends WP_REST_Controller {

	/**
	 * Update the cache settings.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function callback( $request ) {
		$parameters = $request->get_json_params();

		if ( defined( 'DISABLESUPERCACHEPRELOADING' ) ) {
			wp_cache_debug( 'WP_Super_Cache_Rest_Preload: preload disabled by admin' );
			return rest_ensure_response( array( 'error' => 'preload disabled by admin' ) );
		}

		if ( isset( $parameters[ 'enable' ] ) ) {
			if ( $parameters[ 'enable' ] == true ) {
				wp_cache_debug( 'WP_Super_Cache_Rest_Preload: enable' );
				wpsc_enable_preload();
				return( rest_ensure_response( array( 'enabled' => true ) ) );
			} else {
				wp_cache_debug( 'WP_Super_Cache_Rest_Preload: cancel' );
				wpsc_cancel_preload();
				return( rest_ensure_response( array( 'enabled' => false ) ) );
			}
		}
	}
}
