<?php

class WP_Super_Cache_Rest_Update_Plugins extends WP_REST_Controller {

	/**
	 * Toggle plugins on/off through the /plugins/ endpoint
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function callback( $request ) {
		$parameters = $request->get_json_params();

		global $valid_nonce;
		$valid_nonce = true;

		wpsc_update_plugin_list( $parameters );
		$list = wpsc_get_plugin_list();

		return rest_ensure_response( $list );
	}
}
