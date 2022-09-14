<?php
/**
 * The Social Rest Controller class.
 * Registers the REST routes for Social.
 *
 * @package automattic/jetpack-social-plugin
 */

namespace Automattic\Jetpack\Social;

use Automattic\Jetpack\Modules;
use Jetpack_Social;
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
	 * A list of all settings that can be retrieved and updated..
	 *
	 * Items for each setting:
	 * - key: Key to be posted in the request body.
	 * - get_callback: Function to get the current value of the setting.
	 * - update_callback: Function to call to update the setting.
	 * - validation_callback: Gets the return value of the update_callback.
	 *     Return a boolean to indicate if the setting updated successfully.
	 *
	 * @return array
	 */
	public function get_available_settings() {
		return array(
			array(
				'key'                 => 'publicize_active',
				'get_callback'        => function () {
					return ( new Modules() )->is_active( \Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG );
				},
				'update_callback'     => function ( $value ) {
					return ( new Modules() )->update_status( \Jetpack_Social::JETPACK_PUBLICIZE_MODULE_SLUG, (bool) $value, false, false );
				},
				'validation_callback' => function ( $return ) {
					return ! is_wp_error( $return );
				},
			),
			array(
				'key'                 => 'show_pricing_page',
				'get_callback'        => function () {
					return Jetpack_Social::should_show_pricing_page();
				},
				'update_callback'     => function ( $value ) {
					return update_option( Jetpack_Social::JETPACK_SOCIAL_SHOW_PRICING_PAGE_OPTION, (bool) $value );
				},
				'validation_callback' => '__return_true',
			),
		);
	}

	/**
	 * GET `jetpack/v4/social/settings`
	 */
	public function get_settings() {
		$settings = $this->get_available_settings();
		$values   = array_map(
			function ( $setting ) {
				return call_user_func( $setting['get_callback'] );
			},
			$settings
		);

		return rest_ensure_response( array_combine( wp_list_pluck( $settings, 'key' ), $values ) );
	}

	/**
	 * POST `jetpack/v4/social/settings`
	 *
	 * @param WP_REST_Request $request - REST request.
	 */
	public function update_settings( $request ) {
		$request_body = $request->get_json_params();
		$settings     = $this->get_available_settings();

		// Remove any settings that aren't being updated.
		$settings = array_filter(
			$settings,
			function ( $setting ) use ( $request_body ) {
				return isset( $request_body[ $setting['key'] ] );
			}
		);

		// If we're not changing anything, just return the current settings.
		if ( empty( $settings ) ) {
			return rest_ensure_response( $this->get_settings() );
		}

		$errors = array();

		foreach ( $settings as $setting ) {
			$update = call_user_func( $setting['update_callback'], $request_body[ $setting['key'] ] );

			if ( ! call_user_func( $setting['validation_callback'], $update ) ) {
				$errors[] = $setting['key'];
			}
		}

		if ( ! empty( $errors ) ) {
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
					join( ', ', $errors )
				),
				array( 'status' => 400 )
			);
		}

		return rest_ensure_response( $this->get_settings() );
	}
}
