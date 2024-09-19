<?php
/**
 * WP_REST_WPCOM_Block_Editor_Recommended_Tags_Modal_Controller file.
 *
 * @package Automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\NUX;

/**
 * Class WP_REST_WPCOM_Block_Editor_Recommended_Tags_Modal_Controller.
 */
class WP_REST_WPCOM_Block_Editor_Recommended_Tags_Modal_Controller extends \WP_REST_Controller {
	/**
	 * WP_REST_WPCOM_Block_Editor_Recommended_Tags_Modal_Controller constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'block-editor/recommended-tags-modal-dismissed';
	}

	/**
	 * Register available routes.
	 */
	public function register_rest_route() {
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'set_wpcom_recommended_tags_modal_dismissed' ),
					'permission_callback' => array( $this, 'permission_callback' ),
				),
			)
		);
	}

	/**
	 * Callback to determine whether the request can proceed.
	 *
	 * @return boolean
	 */
	public function permission_callback() {
		return current_user_can( 'read' );
	}

	/**
	 * Get the recommended tags modal dismissed status
	 *
	 * @return boolean
	 */
	public static function get_wpcom_recommended_tags_modal_dismissed() {
		return (bool) get_option( 'wpcom_recommended_tags_modal_dismissed', false );
	}

	/**
	 * Dismiss the recommended tags modal
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response
	 */
	public function set_wpcom_recommended_tags_modal_dismissed( $request ) {
		$params = $request->get_json_params();
		update_option( 'wpcom_recommended_tags_modal_dismissed', $params['wpcom_recommended_tags_modal_dismissed'] );
		return rest_ensure_response( array( 'wpcom_recommended_tags_modal_dismissed' => $this->get_wpcom_recommended_tags_modal_dismissed() ) );
	}
}
