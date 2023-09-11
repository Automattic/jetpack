<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack\Boost_Core\Lib\Boost_API;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;

/**
 * API Endpoint for starting an Image Size Analysis run.
 * Lives at POST jetpack-boost/v1/image-size-analysis/start
 */
class Image_Analysis_Start implements Endpoint {

	public function request_methods() {
		return \WP_REST_Server::EDITABLE;
	}

	public function response( $_request ) {
		// @TODO: Add a proper feature flag for this instead of just checking if priority support available.
		if ( ! Premium_Features::has_feature( Premium_Features::IMAGE_SIZE_ANALYSIS ) ) {
			return new \WP_Error( 'not-allowed', 'Feature not enabled' );
		}

		// Send a request to WPCOM asking for a new Image Size Analysis run.
		$response = Boost_API::post(
			'image-guide/reports',
			array(
				'report_type' => 'image-guide',
			)
		);

		// If WPCOM complains, add a little context to the error.
		if ( is_wp_error( $response ) ) {
			return new \WP_Error(
				$response->get_error_code(),
				sprintf(
					/* translators: %s is the original error message from WPCOM */
					__(
						'Error received while communicating with the back-end service: %s',
						'jetpack-boost'
					),
					$response->get_error_message()
				)
			);
		}

		// Send a success response.
		return rest_ensure_response(
			array(
				'ok' => true,
			)
		);
	}

	public function permissions() {
		return array(
			new Current_User_Admin(),
		);
	}

	public function name() {
		return 'image-size-analysis/start';
	}
}
