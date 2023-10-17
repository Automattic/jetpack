<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Admin\Config;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Image_Size_Analysis_Fixer;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;

/**
 * API Endpoint for starting an Image Size Analysis run.
 * Lives at POST jetpack-boost/v1/image-size-analysis/fix
 */
class Image_Analysis_Fix implements Endpoint {

	const NONCE_ACTION = Config::FIX_IMAGE_DIMENSIONS_NONCE;

	public function request_methods() {
		return \WP_REST_Server::EDITABLE;
	}

	public function response( $request ) {
		// @TODO: Add a proper feature flag for this instead of just checking if priority support available.
		if ( ! Premium_Features::has_feature( Premium_Features::IMAGE_SIZE_ANALYSIS ) ) {
			return new \WP_Error( 'not-allowed', 'Feature not enabled' );
		}

		if ( empty( $request->get_param( 'nonce' ) ) || ! wp_verify_nonce( sanitize_key( $request->get_param( 'nonce' ) ), self::NONCE_ACTION ) ) {
			return new \WP_Error( 'not-allowed', 'Bad Nonce' );
		}

		$params        = Image_Size_Analysis_Fixer::sanitize_params( $request->get_params() );
		$fixes         = Image_Size_Analysis_Fixer::get_fixes( $request->get_param( 'post_id' ) );
		$image_url     = Image_Size_Analysis_Fixer::fix_url( $request->get_param( 'image_url' ) );
		$attachment_id = attachment_url_to_postid( esc_url( $image_url ) );

		if ( isset( $params['fix'] ) && ! $params['fix'] ) {
			if ( isset( $fixes[ $attachment_id ] ) ) {
				unset( $fixes[ $attachment_id ] );
			} else {
				unset( $fixes[ md5( $image_url ) ] );
			}
		} elseif ( $attachment_id ) {
			$fixes[ $attachment_id ] = $params;
		} else {
			$fixes[ md5( $image_url ) ] = $params; // hot linked image, possibly from another site.
		}

		update_post_meta( $request->get_param( 'post_id' ), 'jb_image_fixes', $fixes );

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
		return 'image-size-analysis/fix';
	}
}
