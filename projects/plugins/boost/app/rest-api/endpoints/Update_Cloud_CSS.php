<?php
/**
 * Save generated cloud critical CSS.
 *
 * This endpoint is used by WP.com to push the generated CSS to the boost plugin.
 */
namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS\Cloud_CSS_State;
use Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS\Cloud_CSS_Storage;
use Automattic\Jetpack_Boost\REST_API\Contracts;
use Automattic\Jetpack_Boost\REST_API\Permissions\Signed_With_Blog_Token;
use WP_REST_Server;

class Update_Cloud_CSS implements Contracts\Endpoint {

	public function name() {
		return 'cloud-css/update';
	}

	public function request_methods() {
		return WP_REST_Server::EDITABLE;
	}

	public function response( $request ) {
		$request_body = $request->get_body();

		try {
			$request_body = json_decode( $request_body );
			foreach ( $request_body as $result ) {
				$state   = new Cloud_CSS_State();
				$storage = new Cloud_CSS_Storage();

				if ( $result->success ) {
					$state->set_source_success( $result->provider );
					$storage->store_css( $result->provider, $result->data->css );
				} else {
					$state->set_source_error( $result->provider, $result->error );
				}
			}

			wp_send_json_success();
		} catch ( \Exception $e ) {
			return new \WP_Error( 'invalid_json', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	public function permissions() {
		return array(
			new Signed_With_Blog_Token(),
		);
	}
}
