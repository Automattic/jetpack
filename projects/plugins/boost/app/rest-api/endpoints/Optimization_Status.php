<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Lib\State;
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
		$module      = new State( $module_slug );

		// @TODO: Validate that the module exists?
		//		if ( ! $module ) {
		//			return \WP_Error( 'jetpack_boost_invalid_module', __( 'Module not found', 'jetpack-boost' ) );
		//		}
		if ( true === $params['status'] ) {
			$module->enable();
		} else {
			$module->disable();
		}
		return rest_ensure_response(
			$module->is_enabled()
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
