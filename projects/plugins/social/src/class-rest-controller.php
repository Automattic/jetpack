<?php
/**
 * The Social Rest Controller class.
 * Registers the REST routes for Social.
 *
 * @package automattic/jetpack-social-plugin
 */

namespace Automattic\Jetpack\Social;

use Automattic\Jetpack\Modules;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Registers the REST routes for Social.
 */
class REST_Controller {
	/**
	 * Registers the REST routes for Social.
	 *
	 * @access public
	 * @static
	 */
	public function register_rest_routes() {
		register_rest_route(
			'jetpack/v4',
			'/social/settings',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_settings' ),
				'permission_callback' => array( $this, 'require_admin_privilege_callback' ),
			)
		);
		register_rest_route(
			'jetpack/v4',
			'/social/settings',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => array( $this, 'update_settings' ),
				'permission_callback' => array( $this, 'require_admin_privilege_callback' ),
			)
		);

	}

	/**
	 * Only administrators can access the API.
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public function require_admin_privilege_callback() {
		if ( current_user_can( 'manage_options' ) ) {
			return true;
		}

		return new WP_Error(
			'rest_forbidden',
			esc_html__( 'You are not allowed to perform this action.', 'jetpack-social' ),
			array( 'status' => rest_authorization_required_code() )
		);
	}

	/**
	 * GET `jetpack/v4/social/settings`
	 */
	public function get_settings() {
		return rest_ensure_response(
			array(
				'publicize_active' => ( new Modules() )->is_active( \Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG ),
			)
		);
	}

	/**
	 * POST `jetpack/v4/social/settings`
	 *
	 * @param WP_REST_Request $request - REST request.
	 */
	public function update_settings( $request ) {
		$request_body = $request->get_json_params();

		$publicize_active = isset( $request_body['publicize_active'] ) ? (bool) $request_body['publicize_active'] : null;

		// If we're not changing anything, just return the current settings.
		if ( $publicize_active === null ) {
			return rest_ensure_response( $this->get_settings() );
		}

		$publicize_active_updated = ( new Modules() )->update_status( \Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG, $publicize_active, false, false );

		if ( is_wp_error( $publicize_active_updated ) ) {
			/**
			 * Return an error if some settings didn't update. The error name
			 * and message are intentionally generic to allow for updating more
			 * settings in the future.
			 */
			return new WP_Error(
				'some_not_updated',
				sprintf(
					/* translators: %s are the setting name(s) that did not update. */
					__( 'Some settings ( %s ) not updated.', 'jetpack-social' ),
					\Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG
				),
				array( 'status' => 400 )
			);
		}

		return rest_ensure_response( $this->get_settings() );
	}
}
