<?php
/**
 * Create a new request for cloud critical CSS.
 *
 * Handler for POST 'cloud-css/request-generate'.
 */
namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS\Generator;
use Automattic\Jetpack_Boost\REST_API\Contracts;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;
use WP_REST_Server;

class Cloud_CSS_Status implements Contracts\Endpoint {

	public function name() {
		return 'cloud-css/status';
	}

	public function request_methods() {
		return WP_REST_Server::READABLE;
	}

	//phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public function response( $request ) {
		$generator = new Generator( 'cloud' );
		return $generator->get_critical_css_status();
	}

	public function permissions() {
		return array(
			new Current_User_Admin(),
		);
	}
}
