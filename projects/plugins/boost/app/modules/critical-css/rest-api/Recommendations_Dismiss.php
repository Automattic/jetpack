<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\Recommendations;

class Recommendations_Dismiss implements Boost_Endpoint, Nonce_Protection {

	public function request_methods() {
		return \WP_REST_Server::EDITABLE;
	}

	public function response( $request ) {
		$provider_key = filter_var( $request['providerKey'], FILTER_SANITIZE_STRING );
		if ( empty( $provider_key ) ) {
			wp_send_json_error();
		}

		$recommendations = new Recommendations();
		$recommendations->dismiss( $provider_key );
		wp_send_json_success();
	}

	public function permission_callback( $request ) {
		return current_user_can( 'manage_options' );
	}

	public function name() {
		return 'recommendations/dismiss';
	}

}
