<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Admin\Config;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Image_Size_Analysis_Fixer;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;

/**
 * API Endpoint for starting an Image Size Analysis run.
 * Lives at POST jetpack-boost/v1/image-size-analysis/action/fix
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
		$json_params = $request->get_json_params();
		$data   = isset( $json_params['JSON'] ) ? $json_params['JSON'] : null;

		if ( empty( $data['nonce'] ) || ! wp_verify_nonce( sanitize_key( $data['nonce'] ), self::NONCE_ACTION ) ) {
			return new \WP_Error( 'not-allowed', 'Bad Nonce' );
		}

		try {
			$params = Image_Size_Analysis_Fixer::sanitize_params( $data );
		} catch ( \Exception $e ) {
			return new \WP_Error( 'bad-params', $e->getMessage() );
		}
		$fixes         = Image_Size_Analysis_Fixer::get_fixes( $params['post_id'] );
		$image_url     = Image_Size_Analysis_Fixer::fix_url( $params[ 'image_url' ] );
		$attachment_id = attachment_url_to_postid( esc_url( $image_url ) );
		$changed       = false;

		if ( isset( $params['fix'] ) && ! $params['fix'] ) {
			if ( isset( $fixes[ $attachment_id ] ) ) {
				unset( $fixes[ $attachment_id ] );
			} else {
				unset( $fixes[ md5( $image_url ) ] );
			}
			$changed = 'removed';
		} elseif ( $attachment_id ) {
			$fixes[ $attachment_id ] = $params;
			$changed                 = 'fix';
		} else {
			$fixes[ md5( $image_url ) ] = $params; // hot linked image, possibly from another site.
			$changed                    = 'fix';
		}

		if ( $changed ) {
			$status = update_post_meta( $data['post_id'], '_jb_image_fixes', $fixes );
		}

		if ( ! $status ) {
			return rest_ensure_response(
				array(
					'status' => 'error',
					'JSON'   => array(
						'status' => 'error',
						'code'   => 'failed-to-save-fixes',
					),
				)
			);
		}

		return rest_ensure_response(
			array(
				'status' => 'success',
				'JSON'   => array(
					'status'  => 'success',
					'code'    => 'fixes-saved',
					'changed' => $changed,
					'image_id' => $data['image_id'],
				),
			)
		);
	}

	public function permissions() {
		return array(
			new Current_User_Admin(),
		);
	}

	public function name() {

		//// TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		//// TEMPORARY HACK DO NOT SHIP ///////
		/// vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
		register_rest_route(
			'jetpack-boost-ds',
			'image-size-analysis/action/fix',
			array(
				'methods'             => $this->request_methods(),
				'callback'            => array( $this, 'response' ),
				'permission_callback' => '__return_true',
			)
		);
		// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
		//// TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		///  TEMPORARY HACK DO NOT SHIP ///////
		//// TEMPORARY HACK DO NOT SHIP ///////
		return 'jetpack-boost-ds/image-size-analysis/action/fix';
	}
}
