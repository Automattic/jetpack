<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS\Generator;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;

class Generator_Status implements Endpoint {

	public function request_methods() {
		return \WP_REST_Server::READABLE;
	}

	public function response( $_request ) {
		$generator = new Generator();
		return rest_ensure_response( $generator->get_critical_css_status() );
	}

	public function permissions() {
		return array(
			new Current_User_Admin(),
		);
	}
	public function name() {
		return 'status';
	}
}
