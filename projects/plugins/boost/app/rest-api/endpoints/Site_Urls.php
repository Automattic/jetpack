<?php
/**
 * Create a new request for site urls.
 *
 * Handler for GET '/site-urls'.
 */

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Lib\Site_Urls_Grabber as Url_Grabber;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;

class Site_Urls implements Endpoint {

	public function request_methods() {
		return \WP_REST_Server::READABLE;
	}

	// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public function response( $request ) {
		return rest_ensure_response( Url_Grabber::grab() );
	}

	public function permissions() {
		return array(
			new Current_User_Admin(),
		);
	}

	public function name() {
		return '/site-urls';
	}
}
