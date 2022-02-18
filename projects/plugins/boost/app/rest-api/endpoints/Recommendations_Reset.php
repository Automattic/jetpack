<?php
namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Recommendations;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;
use Automattic\Jetpack_Boost\REST_API\Permissions\Nonce;

class Recommendations_Reset implements Endpoint {

	public function request_methods() {
		return \WP_REST_Server::EDITABLE;
	}

	// $request is required to adhere to the contract.
	//phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public function response( $request ) {
		$recommendations = new Recommendations();
		$recommendations->reset();
		wp_send_json_success();
	}

	public function permissions() {
		return array(
			new Nonce( $this->name() ),
			new Current_User_Admin(),
		);
	}

	public function name() {
		return 'recommendations/reset';
	}
}
