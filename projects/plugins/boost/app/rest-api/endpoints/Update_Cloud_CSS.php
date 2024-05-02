<?php
/**
 * Save generated cloud critical CSS.
 *
 * This endpoint is used by WP.com to push the generated CSS to the boost plugin.
 */

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Signed_With_Blog_Token;
use WP_REST_Server;

/**
 * Handler for POST cloud-css/update. Expects the following body params:
 * - success: boolean - False if the whole Critical CSS job failed.
 * - message: string containing an error message if success is false.
 * - providers: Object containing one result for each provider_key:
 *
 * Each provider key contains:
 * - success: boolean - False if this provider key failed.
 * - data: Either a successful CSS block, or a CSS error.
 *
 * Each CSS block looks like:
 * - css: string - containing CSS data.
 *
 * Each CSS error looks like:
 * - urls: Object describing each URL which failed. Keys are URLs.
 *
 * Each URL failure looks like:
 * - message: string - containing an error message.
 * - type: string - machine readable error type.
 * - meta: Object - JSON string compatible object containing extra metadata for consumption in the UI.
 */
class Update_Cloud_CSS implements Endpoint {

	public function name() {
		return 'cloud-css/update';
	}

	public function request_methods() {
		return WP_REST_Server::EDITABLE;
	}

	public function response( $request ) {
		$state          = new Critical_CSS_State();
		$storage        = new Critical_CSS_Storage();
		$params         = $request->get_params();
		$providers      = empty( $params['providers'] ) || ! is_array( $params['providers'] ) ? array() : $params['providers'];
		$api_successful = array( 'success' => true );

		// If success is false, the whole Cloud CSS generation process failed.
		if ( empty( $params['success'] ) ) {
			if ( empty( $params['message'] ) || ! is_string( $params['message'] ) ) {
				$error = __( 'An unknown error occurred', 'jetpack-boost' );
			} else {
				$error = $params['message'];
			}

			$state->set_error( $error );
			$state->save();

			return $api_successful;
		}

		// Update each provider.
		foreach ( $providers as $provider_key => $result ) {
			if ( ! isset( $result['data'] ) ) {
				return new \WP_Error( 'invalid_data', __( 'Invalid request; missing data element', 'jetpack-boost' ) );
			}

			$data = $result['data'];

			// Success
			if ( ! empty( $result['success'] ) && ! empty( $data['css'] ) && is_string( $data['css'] ) ) {
				$storage->store_css( $provider_key, $data['css'] );
				$state->set_provider_success( $provider_key );
				continue;
			}

			// Failures must have an array of urls.
			if ( empty( $data['urls'] ) || ! is_array( $data['urls'] ) ) {
				return new \WP_Error( 'invalid_data', __( 'Invalid request; missing urls element', 'jetpack-boost' ) );
			}

			$state->set_provider_errors( $provider_key, $this->flatten_url_errors( $data['urls'] ) );
		}

		// Save the state changes.
		$state->save();

		return $api_successful;
	}

	/**
	 * Errors arrive from Shield in an associative array with the URL as the key.
	 * This function flattens the array into a list of assoc arrays with the URL in each member.
	 */
	private function flatten_url_errors( $errors ) {
		$flat_errors = array();

		foreach ( $errors as $url => $error ) {
			$flat_errors[] = array_merge( array( 'url' => $url ), $error );
		}

		return $flat_errors;
	}

	public function permissions() {
		return array(
			new Signed_With_Blog_Token(),
		);
	}
}
