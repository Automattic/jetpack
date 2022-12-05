<?php
/**
 * Class use to register REST API endpoints used by the WAF
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Connection\REST_Connector;
use WP_Error;
use WP_REST_Server;

/**
 * Defines our endponts.
 */
class REST_Controller {
	/**
	 * Register REST API endpoints.
	 */
	public static function register_rest_routes() {
		register_rest_route(
			'jetpack/v4',
			'/waf',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::waf',
				'permission_callback' => __CLASS__ . '::waf_permissions_callback',
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/waf/update-rules',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::update_rules',
				'permission_callback' => __CLASS__ . '::waf_permissions_callback',
			)
		);
	}

	/**
	 * Get Bootstrap File Path
	 *
	 * @return string The path to the Jetpack Firewall's bootstrap.php file.
	 */
	private static function get_bootstrap_file_path() {
		$bootstrap = new Waf_Standalone_Bootstrap();
		return $bootstrap->get_bootstrap_file_path();
	}

	/**
	 * Update rules endpoint
	 */
	public static function update_rules() {
		$success = true;
		$message = 'Rules updated succesfully';

		try {
			Waf_Runner::generate_rules();
		} catch ( \Exception $e ) {
			$success = false;
			$message = $e->getMessage();
		}

		return rest_ensure_response(
			array(
				'success' => $success,
				'message' => $message,
			)
		);
	}

	/**
	 * WAF Endpoint
	 */
	public static function waf() {
		return rest_ensure_response(
			array(
				'bootstrapPath' => self::get_bootstrap_file_path(),
			)
		);
	}

	/**
	 * WAF Endpoint Permissions Callback
	 *
	 * @return bool|WP_Error True if user can view the Jetpack admin page.
	 */
	public static function waf_permissions_callback() {
		if ( current_user_can( 'jetpack_manage_modules' ) ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_manage_modules',
			REST_Connector::get_user_permissions_error_msg(),
			array( 'status' => rest_authorization_required_code() )
		);
	}
}
