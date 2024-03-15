<?php
/**
 * Create a new request for source providers.
 *
 * Handler for GET '/list-source-providers'.
 */

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Providers;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;

class List_Source_Providers implements Endpoint {

	public function request_methods() {
		return \WP_REST_Server::READABLE;
	}

	public function response( $_request ) {
		$providers = new Source_Providers();
		return rest_ensure_response( $providers->get_provider_sources() );
	}

	public function permissions() {
		return array();
	}

	public function name() {
		return '/list-source-providers';
	}
}
