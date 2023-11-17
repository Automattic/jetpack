<?php
/**
 * Create a new request for cloud critical CSS.
 *
 * Handler for POST 'cloud-css/request-generate'.
 */

namespace Automattic\Jetpack_Inspect\REST_API\Endpoints;

use Automattic\Jetpack_Inspect\REST_API\Contracts\Endpoint;

class Test_Request implements Endpoint {

	public function name() {
		return 'test-request';
	}

	public function request_methods() {
		return \WP_REST_Server::READABLE;
	}

	//phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public function response( $request ) {
		return rest_ensure_response(
			wp_remote_request( 'http://timeout.comm' . time() )
		);
	}

	public function permissions() {
		return true;
	}
}
