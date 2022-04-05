<?php
/**
 * Save generated cloud critical CSS.
 *
 * This endpoint is used by WP.com to push the generated CSS to the boost plugin.
 */
namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
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
		$params = $request->get_params();

		try {
			$providers = $params['providers'];
			$state     = new Critical_CSS_State( 'cloud' );
			$storage   = new Critical_CSS_Storage();

			foreach ( $providers as $provider => $result ) {
				if ( ! isset( $result['data'] ) ) {
					$state->set_as_failed( __( 'An unknown error occurred', 'jetpack-boost' ) );
					continue;
				}
				$data = $result['data'];
				if ( isset( $result['success'] ) && $result['success'] ) {
					$state->set_source_success( $provider );
					$storage->store_css( $provider, $data['css'] );
				} elseif ( isset( $data['show_stopper'] ) && $data['show_stopper'] ) {
					$state->set_as_failed( $data['error'] );
				} else {
					$state->set_source_error( $provider, $data['urls'] );
				}
			}
			$state->maybe_set_status();

			wp_send_json_success();
		} catch ( \Exception $e ) {
			return new \WP_Error( 'invalid_request', $e->getMessage(), array( 'status' => 400 ) );
		}
	}

	public function permissions() {
		return array(
			new Signed_With_Blog_Token(),
		);
	}
}
