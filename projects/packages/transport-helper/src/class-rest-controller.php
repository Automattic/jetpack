<?php
/**
 * The Jetpack Helper Script Rest Controller class.
 * Registers the REST routes.
 *
 * @package automattic/jetpack-transport-helper
 */

namespace Automattic\Jetpack\Transport_Helper;

use Automattic\Jetpack\Connection\Rest_Authentication;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Registers the REST routes.
 */
class REST_Controller {
	/**
	 * Registers the REST routes.
	 *
	 * @access public
	 * @static
	 */
	public static function register_rest_routes() {
		// Install a Helper Script to assist with fetching data.
		register_rest_route(
			'jetpack/v4',
			// This route can be generalized once we no longer depend on the backup package
			'/backup-helper-script',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => __CLASS__ . '::install_helper_script',
				'permission_callback' => __CLASS__ . '::helper_script_permissions_callback',
				'args'                => array(
					'helper' => array(
						'description' => __( 'base64 encoded Helper Script body.', 'jetpack-transport-helper' ),
						'type'        => 'string',
						'required'    => true,
					),
				),
			)
		);

		// Delete a Helper Script.
		register_rest_route(
			'jetpack/v4',
			// This route can be generalized once we no longer depend on the backup package
			'/backup-helper-script',
			array(
				'methods'             => WP_REST_Server::DELETABLE,
				'callback'            => __CLASS__ . '::delete_helper_script',
				'permission_callback' => __CLASS__ . '::helper_script_permissions_callback',
				'args'                => array(
					'path' => array(
						'description' => __( 'Path to Helper Script', 'jetpack-transport-helper' ),
						'type'        => 'string',
						'required'    => true,
					),
				),
			)
		);
	}

	/**
	 * The Jetpack endpoints should only be available via site-level authentication.
	 * This means that the corresponding endpoints can only be accessible from WPCOM.
	 *
	 * @access public
	 * @static
	 *
	 * @return bool|WP_Error True if a blog token was used to sign the request, WP_Error otherwise.
	 */
	public static function helper_script_permissions_callback() {
		if ( Rest_Authentication::is_signed_with_blog_token() ) {
			return true;
		}

		$error_msg = esc_html__(
			'You are not allowed to perform this action.',
			'jetpack-transport-helper'
		);

		return new WP_Error( 'rest_forbidden', $error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

	/**
	 * Install the Helper Script.
	 *
	 * @access public
	 * @static
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @return array|WP_Error Returns the result of Helper Script installation. Returns one of:
	 * - WP_Error on failure, or
	 * - An array with installation info on success:
	 *  'path'    (string) The sinstallation path.
	 *  'url'     (string) The access url.
	 *  'abspath' (string) The abspath.
	 */
	public static function install_helper_script( $request ) {
		$helper_script = $request->get_param( 'helper' );

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		$helper_script = base64_decode( $helper_script );
		if ( ! $helper_script ) {
			return new WP_Error( 'invalid_args', __( 'Helper Script body must be base64 encoded', 'jetpack-transport-helper' ), 400 );
		}

		$installation_info = Helper_Script_Manager::install_helper_script( $helper_script );
		Helper_Script_Manager::cleanup_expired_helper_scripts();

		// Include ABSPATH with successful result.
		if ( ! is_wp_error( $installation_info ) ) {
			$installation_info['abspath'] = ABSPATH;
		}

		return rest_ensure_response( $installation_info );
	}

	/**
	 * Delete a Helper Script.
	 *
	 * @access public
	 * @static
	 *
	 * @param WP_REST_Request $request The request sent to the WP REST API.
	 * @return array An array with 'success' key indicating the result of the delete operation.
	 */
	public static function delete_helper_script( $request ) {
		$path_to_helper_script = $request->get_param( 'path' );

		$deleted = Helper_Script_Manager::delete_helper_script( $path_to_helper_script );
		Helper_Script_Manager::cleanup_expired_helper_scripts();

		return rest_ensure_response(
			array(
				'success' => $deleted,
			)
		);
	}

}
