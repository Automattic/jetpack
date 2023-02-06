<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Features\Optimizations\Optimizations;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;

class Optimizations_Status implements Endpoint {

	public function request_methods() {
		return \WP_REST_Server::READABLE;
	}

	// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public function response( $request ) {
		$optimizations = ( new Optimizations() )->get_status();
		return rest_ensure_response( $optimizations );
	}

	public function permissions() {
		return array(
			new Current_User_Admin(),
		);
	}

	public function name() {
		return '/optimizations/status';
	}
}
