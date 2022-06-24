<?php
/**
 * Save generated cloud critical CSS.
 *
 * This endpoint is used by WP.com to push the generated CSS to the boost plugin.
 */
namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS\Cloud_CSS;
use Automattic\Jetpack_Boost\REST_API\Contracts;
use Automattic\Jetpack_Boost\REST_API\Permissions\Signed_With_Blog_Token;
use WP_REST_Server;

class Update_Cloud_CSS implements Contracts\Endpoint {

	public function name() {
		return 'cloud-css/update';
	}

	public function request_methods() {
		return WP_REST_Server::EDITABLE;
	}

	public function response( $request ) {
		$feature = new Cloud_CSS();
		return $feature->update_cloud_css( $request->get_params() );
	}

	public function permissions() {
		return array(
			new Signed_With_Blog_Token(),
		);
	}
}
