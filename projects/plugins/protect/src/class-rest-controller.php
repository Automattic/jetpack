<?php
/**
 * Class file for managing REST API endpoints for Jetpack Protect.
 *
 * @since 1.2.2
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\Waf\Waf_Runner;
use Jetpack_Protect;
use WP_REST_Response;

/**
 * Class REST_Controller
 */
class REST_Controller {

	/**
	 * Initialize the plugin's REST API.
	 *
	 * @return void
	 */
	public static function init() {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		// Add custom WP REST API endoints.
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_endpoints' ) );
	}

	/**
	 * Register the REST API routes.
	 *
	 * @return void
	 */
	public static function register_rest_endpoints() {
		register_rest_route(
			'jetpack-protect/v1',
			'check-plan',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::api_check_plan',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'status',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::api_get_status',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'clear-scan-cache',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::api_clear_scan_cache',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'ignore-threat',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::api_ignore_threat',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'fix-threats',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::api_fix_threats',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'fix-threats-status',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::api_fix_threats_status',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'check-credentials',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::api_check_credentials',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'scan',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::api_scan',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'toggle-waf',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::api_toggle_waf',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'waf',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::api_get_waf',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'waf-seen',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::api_get_waf_seen_status',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'waf-seen',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::api_set_waf_seen_status',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'waf-upgrade-seen',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::api_get_waf_upgrade_seen_status',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		register_rest_route(
			'jetpack-protect/v1',
			'waf-upgrade-seen',
			array(
				'methods'             => \WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::api_set_waf_upgrade_seen_status',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}

	/**
	 * Return site plan data for the API endpoint
	 *
	 * @return WP_REST_Response
	 */
	public static function api_check_plan() {
		$has_required_plan = Plan::has_required_plan();

		return rest_ensure_response( $has_required_plan, 200 );
	}

	/**
	 * Return Protect Status for the API endpoint
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public static function api_get_status( $request ) {
		$status = Status::get_status( $request['hard_refresh'] );
		return rest_ensure_response( $status, 200 );
	}

	/**
	 * Clear the Scan_Status cache for the API endpoint
	 *
	 * @return WP_REST_Response
	 */
	public static function api_clear_scan_cache() {
		$cache_cleared = Scan_Status::delete_option();

		if ( ! $cache_cleared ) {
			return new WP_REST_Response( 'An error occured while attempting to clear the Jetpack Scan cache.', 500 );
		}

		return new WP_REST_Response( 'Jetpack Scan cache cleared.' );
	}

	/**
	 * Ignores a threat for the API endpoint
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public static function api_ignore_threat( $request ) {
		if ( ! $request['threat_id'] ) {
			return new WP_REST_Response( 'Missing threat ID.', 400 );
		}

		$threat_ignored = Threats::ignore_threat( $request['threat_id'] );

		if ( ! $threat_ignored ) {
			return new WP_REST_Response( 'An error occured while attempting to ignore the threat.', 500 );
		}

		return new WP_REST_Response( 'Threat ignored.' );
	}

	/**
	 * Fixes threats for the API endpoint
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public static function api_fix_threats( $request ) {
		if ( empty( $request['threat_ids'] ) ) {
			return new WP_REST_Response( 'Missing threat IDs.', 400 );
		}

		$threats_fixed = Threats::fix_threats( $request['threat_ids'] );

		if ( ! $threats_fixed ) {
			return new WP_REST_Response( 'An error occured while attempting to fix the threat.', 500 );
		}

		return new WP_REST_Response( $threats_fixed );
	}

	/**
	 * Fixes threats for the API endpoint
	 *
	 * @param WP_REST_Request $request The request object.
	 *
	 * @return WP_REST_Response
	 */
	public static function api_fix_threats_status( $request ) {
		if ( empty( $request['threat_ids'] ) ) {
			return new WP_REST_Response( 'Missing threat IDs.', 400 );
		}

		$threats_fixed = Threats::fix_threats_status( $request['threat_ids'] );

		if ( ! $threats_fixed ) {
			return new WP_REST_Response( 'An error occured while attempting to get the fixer status of the threats.', 500 );
		}

		return new WP_REST_Response( $threats_fixed );
	}

	/**
	 * Checks if the site has credentials configured
	 *
	 * @return WP_REST_Response
	 */
	public static function api_check_credentials() {
		$credential_array = Credentials::get_credential_array();

		if ( ! isset( $credential_array ) ) {
			return new WP_REST_Response( 'An error occured while attempting to fetch the credentials array', 500 );
		}

		return new WP_REST_Response( $credential_array );
	}

	/**
	 * Enqueues a scan for the API endpoint
	 *
	 * @return WP_REST_Response
	 */
	public static function api_scan() {
		$scan_enqueued = Threats::scan();

		if ( ! $scan_enqueued ) {
			return new WP_REST_Response( 'An error occured while attempting to enqueue the scan.', 500 );
		}

		return new WP_REST_Response( 'Scan enqueued.' );
	}

	/**
	 * Toggles the WAF module on or off for the API endpoint
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public static function api_toggle_waf() {
		if ( Waf_Runner::is_enabled() ) {
			$disabled = Waf_Runner::disable();
			if ( ! $disabled ) {
				return new WP_Error(
					'waf_disable_failed',
					__( 'An error occured disabling the firewall.', 'jetpack-protect' ),
					array( 'status' => 500 )
				);
			}

			return rest_ensure_response( true );
		}

		$enabled = Waf_Runner::enable();
		if ( ! $enabled ) {
			return new WP_Error(
				'waf_enable_failed',
				__( 'An error occured enabling the firewall.', 'jetpack-protect' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response( true );
	}

	/**
	 * Get WAF data for the API endpoint
	 *
	 * @return WP_Rest_Response
	 */
	public static function api_get_waf() {
		// Ensure plugin activation has been performed so WAF module is available.
		Jetpack_Protect::do_plugin_activation_activities();

		return new WP_REST_Response(
			array(
				'is_seen'    => Jetpack_Protect::get_waf_seen_status(),
				'is_enabled' => Waf_Runner::is_enabled(),
				'config'     => Waf_Runner::get_config(),
				'stats'      => Jetpack_Protect::get_waf_stats(),
			)
		);
	}

	/**
	 * Get WAF "Seen" status for the API endpoint
	 *
	 * @return bool Whether the current user has viewed the WAF screen.
	 */
	public static function api_get_waf_seen_status() {
		return Jetpack_Protect::get_waf_seen_status();
	}

	/**
	 * Set WAF "Seen" status for the API endpoint
	 *
	 * @return bool True if seen status updated to true, false on failure.
	 */
	public static function api_set_waf_seen_status() {
		return Jetpack_Protect::set_waf_seen_status();
	}

	/**
	 * Get WAF Upgrade "Seen" Status for the API endpoint
	 *
	 * @return bool Whether the current user has dismissed the upgrade popover or enabled the automatic rules feature.
	 */
	public static function api_get_waf_upgrade_seen_status() {
		return Jetpack_Protect::get_waf_upgrade_seen_status();
	}

	/**
	 * Set WAF Upgrade "Seen" Status for the API endpoint
	 *
	 * @return bool True if upgrade seen status updated to true, false on failure.
	 */
	public static function api_set_waf_upgrade_seen_status() {
		return Jetpack_Protect::set_waf_upgrade_seen_status();
	}
}
