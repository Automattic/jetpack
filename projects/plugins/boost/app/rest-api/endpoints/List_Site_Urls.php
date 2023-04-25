<?php
/**
 * Create a new request for site urls.
 *
 * Handler for GET '/list-site-urls'.
 */

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Lib\Site_Urls;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Signed_With_Blog_Token;

class List_Site_Urls implements Endpoint {

	public function request_methods() {
		return \WP_REST_Server::READABLE;
	}

	public function response( $_request ) {
		return rest_ensure_response( Site_Urls::get() );
	}

	public function permissions() {
		return array(
			new Signed_With_Blog_Token(),
		);
	}

	public function name() {
		return '/list-site-urls';
	}
}
