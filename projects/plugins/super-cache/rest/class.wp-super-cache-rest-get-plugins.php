<?php

class WP_Super_Cache_Rest_Get_Plugins extends WP_REST_Controller {

	/**
	 * GET a list of plugins through the /plugins/ endpoint
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function callback( $request ) {

		$list = wpsc_get_plugin_list();
		return rest_ensure_response( $list );
	}
}
