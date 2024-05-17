<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack\Boost_Core\Lib\Boost_API;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;
use Automattic\Jetpack_Boost\Lib\Premium_Features;

/**
 * Image Size Analysis: Action to fix an image
 */
class Image_Size_Analysis_Summary_Action_Start implements Data_Sync_Action {

	public function handle( $_data, $_request ) {
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

			if ( $response->get_error_code() === '429' ) {
					return new \WP_Error(
						$response->get_error_code(),
						__( 'You have sent too many requests, please try later.', 'jetpack-boost' )
					);
			}

			return new \WP_Error(
				$response->get_error_code(),
				sprintf(
				/* translators: %s is the original error message from WordPress.com */
					__(
						'Jetpack Boost Cloud Error: "%s"',
						'jetpack-boost'
					),
					$response->get_error_message()
				)
			);
		}

		// Send a success response.
		return array(
			'ok' => true,
		);
	}
}
