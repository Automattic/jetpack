<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Lib\Status;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;

class Optimization_Status implements Endpoint {

	public function request_methods() {
		return \WP_REST_Server::EDITABLE;
	}

	public function response( $request ) {
		$params = $request->get_json_params();

		if ( ! isset( $params['status'] ) ) {
			return new \WP_Error(
				'jetpack_boost_error_missing_module_status_param',
				__( 'Missing status param', 'jetpack-boost' )
			);
		}
		$module_slug = $request['slug'];
		$state       = new Status( $module_slug );

		// @TODO: Validate that the module exists?

		$new_status = (bool) $params['status'];
		$success    = $state->update( (bool) $params['status'] );

		return rest_ensure_response(
			$success ? $new_status : $state->is_enabled()
		);
	}

	public function permissions() {
		return array(
			new Current_User_Admin(),
		);
	}

	public function name() {
		// @TODO: Rename module to optimization here as well?
		return '/module/(?P<slug>[a-z\-]+)/status';
	}
}
