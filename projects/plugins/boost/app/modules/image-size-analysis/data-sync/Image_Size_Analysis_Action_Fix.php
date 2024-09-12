<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Image_Size_Analysis_Fixer;

/**
 * Image Size Analysis: Action to fix an image
 */
class Image_Analysis_Action_Fix implements Data_Sync_Action {

	/**
	 * Handles the action logic.
	 *
	 * @param mixed            $data    JSON Data passed to the action.
	 * @param \WP_REST_Request $_request The request object.
	 * @return array|\WP_Error WP_Error if the feature is not enabled, otherwise a response array.
	 */
	public function handle( $data, $_request ) {

		if ( ! Premium_Features::has_feature( Premium_Features::IMAGE_SIZE_ANALYSIS ) ) {
			return new \WP_Error( 'not-allowed', 'Feature not enabled' );
		}

		$params        = Image_Size_Analysis_Fixer::sanitize_params( $data );
		$fixes         = Image_Size_Analysis_Fixer::get_fixes( $params['post_id'] );
		$image_url     = Image_Size_Analysis_Fixer::fix_url( $params['image_url'] );
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
			return array(
				'status' => 'error',
				'code'   => 'failed-to-save-fixes',
			);
		}

		return array(
			'status'   => 'success',
			'code'     => 'fixes-saved',
			'changed'  => $changed,
			'image_id' => $data['image_id'],
		);
	}
}
