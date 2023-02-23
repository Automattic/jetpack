<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS\Generator;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\Lib\Nonce;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;

class Critical_CSS_Insert implements Endpoint {

	public function request_methods() {
		return \WP_REST_Server::EDITABLE;
	}

	/**
	 * Handler for PUT '/critical-css/<cacheKey>/insert'.
	 *
	 * @param \WP_REST_Request $request The request object.
	 *
	 * @return \WP_REST_Response|\WP_Error The response.
	 * @todo Figure out what to do in the JavaScript when responding with the error status.
	 */
	public function response( $request ) {
		$cache_key = $request['cacheKey'];

		if ( ! $cache_key ) {
			// Set status to error, because the data is invalid.
			return rest_ensure_response(
				array(
					'status' => 'error',
					'code'   => 'missing_cache_key',
				)
			);
		}

		$params = $request->get_params();

		if ( empty( $params['passthrough'] ) || empty( $params['passthrough']['_nonce'] ) ) {
			return rest_ensure_response(
				array(
					'status' => 'error',
					'code'   => 'missing_nonce',
				)
			);
		}

		$cache_key_nonce = $params['passthrough']['_nonce'];

		if ( ! Nonce::verify( $cache_key_nonce, Generator::CSS_CALLBACK_ACTION ) ) {
			return rest_ensure_response(
				array(
					'status' => 'error',
					'code'   => 'invalid_nonce',
				)
			);
		}

		if ( ! isset( $params['data'] ) ) {
			// Set status to error, because the data is invalid.
			return rest_ensure_response(
				array(
					'status' => 'error',
					'code'   => 'invalid_data',
				)
			);
		}

		$storage   = new Critical_CSS_Storage();
		$storage->store_css( $cache_key, $params['data'] );

		Critical_CSS_State::set_fresh();

		// Set status to success to indicate the critical CSS data has been stored on the server.
		return rest_ensure_response(
			array(
				'status'        => 'success',
				'code'          => 'processed',
			)
		);
	}

	public function permissions() {
		return array(
			new Current_User_Admin(),
		);
	}

	public function name() {
		return '/critical-css/(?P<cacheKey>.+)/insert';
	}
}
