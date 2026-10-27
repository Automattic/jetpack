<?php
/**
 * WP_REST_WPCOM_Block_Editor_NUX_Status_Controller file.
 *
 * @package Aautomattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\NUX;

/**
 * Class WP_REST_WPCOM_Block_Editor_NUX_Status_Controller.
 */
class WP_REST_WPCOM_Block_Editor_NUX_Status_Controller extends \WP_REST_Controller {
	/**
	 * Pseudo-scope and key of the Welcome Tour in the user's dismissed welcome guides.
	 */
	const WELCOME_TOUR_SCOPE = 'wpcom/block-editor-nux';
	const WELCOME_TOUR_GUIDE = 'welcomeTour';

	/**
	 * WP_REST_WPCOM_Block_Editor_NUX_Status_Controller constructor.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = 'block-editor/nux';
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
					'methods'             => \WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_nux_status' ),
					'permission_callback' => array( $this, 'permission_callback' ),
				),
				array(
					'methods'             => \WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_nux_status' ),
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
		return is_user_logged_in();
	}

	/**
	 * Should we show the wpcom welcome guide (i.e. welcome tour or nux modal)
	 *
	 * @param mixed $nux_status Can be "enabled", "dismissed", or undefined.
	 * @return boolean
	 */
	public function show_wpcom_welcome_guide( $nux_status ) {
		return 'enabled' === $nux_status;
	}

	/**
	 * Whether the status lives in this site's user meta rather than in WordPress.com's global user
	 * attribute, which Simple sites read and write through the `wpcom_block_editor_nux_*` hooks.
	 *
	 * @return bool
	 */
	private function is_status_stored_locally() {
		return ! has_filter( 'wpcom_block_editor_nux_get_status' );
	}

	/**
	 * Return the WPCOM NUX status
	 *
	 * This is only called for sites where the user hasn't already dismissed the tour.
	 * Once the tour has been dismissed, the closed state is saved in local storage (for the current site)
	 * see src/block-editor-nux.js
	 *
	 * @return \WP_REST_Response
	 */
	public function get_nux_status() {

		$should_open_patterns_panel = (bool) get_option( 'was_created_with_blank_canvas_design' );

		if ( $should_open_patterns_panel ) {
			$variant = 'blank-canvas-tour';
		} else {
			$variant = 'tour';
		}

		if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
			$is_p2 = false;
		} else {
			$blog_id = get_current_blog_id();
			$is_p2   = \WPForTeams\is_wpforteams_site( $blog_id );
		}

		if ( $is_p2 ) {
			// disable welcome tour for authoring P2s.
			// see: https://github.com/Automattic/wp-calypso/issues/62973.
			$nux_status = 'disabled';
		} elseif ( ! $this->is_status_stored_locally() ) {
			$nux_status = apply_filters( 'wpcom_block_editor_nux_get_status', false );
		} else {
			$user_id    = get_current_user_id();
			$nux_status = metadata_exists( 'user', $user_id, 'wpcom_block_editor_nux_status' )
				? get_user_meta( $user_id, 'wpcom_block_editor_nux_status', true )
				: 'enabled';

			// Only ever hides the tour: re-opening it from the editor menu does not read this.
			if ( 'enabled' === $nux_status && wpcom_editor_welcome_guides_is_enabled() ) {
				/** This filter is documented in src/features/editor-welcome-guides/editor-welcome-guides.php */
				$dismissed = apply_filters( 'wpcom_editor_welcome_guides_dismissed', array(), $user_id );
				if ( in_array( self::WELCOME_TOUR_GUIDE, (array) ( $dismissed[ self::WELCOME_TOUR_SCOPE ] ?? array() ), true ) ) {
					$nux_status = 'dismissed';
				}
			}
		}

		$show_welcome_guide = $this->show_wpcom_welcome_guide( $nux_status );

		return rest_ensure_response(
			array(
				'show_welcome_guide' => $show_welcome_guide,
				'variant'            => $variant,
			)
		);
	}

	/**
	 * Update the WPCOM NUX status
	 *
	 * @param \WP_REST_Request $request Request object.
	 * @return \WP_REST_Response
	 */
	public function update_nux_status( $request ) {
		$params     = $request->get_json_params();
		$nux_status = $params['show_welcome_guide'] ? 'enabled' : 'dismissed';
		if ( has_action( 'wpcom_block_editor_nux_update_status' ) ) {
			do_action( 'wpcom_block_editor_nux_update_status', $nux_status );
		}
		update_user_meta( get_current_user_id(), 'wpcom_block_editor_nux_status', $nux_status );

		// Re-enabling stays local to this site.
		if ( 'dismissed' === $nux_status && $this->is_status_stored_locally() && wpcom_editor_welcome_guides_is_enabled() ) {
			/** This action is documented in src/features/editor-welcome-guides/editor-welcome-guides.php */
			do_action( 'wpcom_editor_welcome_guides_dismiss', get_current_user_id(), array( self::WELCOME_TOUR_SCOPE => array( self::WELCOME_TOUR_GUIDE ) ) );
		}

		return rest_ensure_response( array( 'show_welcome_guide' => $this->show_wpcom_welcome_guide( $nux_status ) ) );
	}
}
