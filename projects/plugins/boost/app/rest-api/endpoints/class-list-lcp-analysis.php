<?php
/**
 * Create a new request for LCP analysis data.
 *
 * Handler for GET '/list-lcp-analysis'.
 */

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Modules\Optimizations\Lcp\LCP_Utils;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Signed_With_Blog_Token;

class List_LCP_Analysis implements Endpoint {

	public function request_methods() {
		return \WP_REST_Server::READABLE;
	}

	public function response( $_request ) {
		return rest_ensure_response( LCP_Utils::get_analysis_data() );
	}

	public function permissions() {
		return array(
			new Signed_With_Blog_Token(),
		);
	}

	public function name() {
		return '/list-lcp-analysis';
	}
}
