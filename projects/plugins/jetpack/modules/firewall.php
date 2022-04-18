<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Module Name: Firewall
 * Module Description: Protect your site with Jetpack's Web Application Firewall
 * Sort Order: 5
 * First Introduced: 10.9
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Firewall
 * Feature: Security
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\REST_Connector;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Waf\Waf_Standalone_Bootstrap;

// Register endpoints when WP REST API is initialized.
add_action( 'rest_api_init', array( 'Jetpack_Firewall', 'register_endpoints' ) );

/**
 * Jetpack firewall module class.
 */
class Jetpack_Firewall {

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
	 * Has Rules Access
	 *
	 * @return bool True when the current site has access to latest firewall rules.
	 */
	private static function has_rules_access() {
		// any site with Jetpack Scan can download new WAF rules
		return \Jetpack_Plan::supports( 'scan' );
	}

	/**
	 * UI Enabled
	 *
	 * @return bool True when the WAF settings UI should be displayed.
	 */
	private static function ui_enabled() {
		return Constants::is_true( 'JETPACK_WAF_UI' );
	}

	/**
	 * Register REST API endpoints.
	 */
	public static function register_endpoints() {
		register_rest_route(
			'jetpack/v4',
			'/waf',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::waf',
				'permission_callback' => __CLASS__ . '::waf_permissions_callback',
			)
		);
	}

	/**
	 * WAF Endpoint
	 */
	public static function waf() {
		return rest_ensure_response(
			array(
				'bootstrapPath'  => self::get_bootstrap_file_path(),
				'hasRulesAccess' => self::has_rules_access(),
				'uiEnabled'      => self::ui_enabled(),
			)
		);
	}

	/**
	 * WAF Endpoint Permissions Callback
	 *
	 * @return bool|WP_Error True if user can view the Jetpack admin page.
	 */
	public static function waf_permissions_callback() {
		if ( current_user_can( 'jetpack_admin_page' ) ) {
			return true;
		}

		return new WP_Error(
			'invalid_user_permission_view_admin',
			REST_Connector::get_user_permissions_error_msg(),
			array( 'status' => rest_authorization_required_code() )
		);
	}

}
