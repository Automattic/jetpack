<?php
/**
 * Create a new request for cloud critical CSS.
 *
 * Handler for POST 'cloud-css/request-generate'.
 */
namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS\Cloud_CSS;
use Automattic\Jetpack_Boost\REST_API\Contracts;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;
use WP_REST_Server;

class Request_Cloud_CSS implements Contracts\Endpoint {

	public function name() {
		return 'cloud-css/request-generate';
	}

	public function request_methods() {
		return WP_REST_Server::CREATABLE;
	}

	//phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public function response( $request ) {
		$feature = new Cloud_CSS();
		return $feature->generate_cloud_css();
	}

	public function permissions() {
		return array(
			new Current_User_Admin(),
		);
	}
}
