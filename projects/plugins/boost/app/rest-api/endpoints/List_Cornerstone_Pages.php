<?php
/**
 * Create a new request for cornerstone pages.
 *
 * Handler for GET '/list-cornerstone-pages'.
 */

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Signed_With_Blog_Token;

class List_Cornerstone_Pages implements Endpoint {

	public function request_methods() {
		return \WP_REST_Server::READABLE;
	}

	public function response( $_request ) {
		return rest_ensure_response( Cornerstone_Utils::get_list() );
	}

	public function permissions() {
		return array(
			new Signed_With_Blog_Token(),
		);
	}

	public function name() {
		return '/list-cornerstone-pages';
	}
}
