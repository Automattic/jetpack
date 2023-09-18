<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Admin\Config;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
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

		$params = $request->get_params();
		unset( $params['nonce'] );

		// use WP_Query to find posts with post_parent = $post->ID and post_type = jb_image_fixes

		$posts = get_posts(
			array(
				'post_type'      => 'jb_image_fixes',
				'post_parent'    => $request->get_param( 'post_id' ),
				'posts_per_page' => -1,
				'title'          => $request->get_param( 'image_url' ),
			)
		);

		if ( $posts ) {
			$id = $posts[0]->ID;
			wp_update_post(
				array(
					'ID'           => $id,
					'post_content' => wp_json_encode( $params ),
				)
			);
		} else {
			$id = wp_insert_post(
				array(
					'post_type'    => 'jb_image_fixes',
					'post_title'   => $request->get_param( 'image_url' ),
					'post_content' => wp_json_encode( $params ),
					'post_status'  => 'publish',
					'post_parent'  => $request->get_param( 'post_id' ),
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
		return 'image-size-analysis/fix';
	}
}
