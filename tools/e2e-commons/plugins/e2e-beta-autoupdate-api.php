<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Plugin Name: E2E Jetpack Beta Autoupdate API
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

// Check that the file is not accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\JetpackBeta\Utils;

/**
 * Class E2eJetpackBetaAutoupdateApi
 */
class E2eJetpackBetaAutoupdateApi {

	/**
	 * E2eJetpackBetaAutoupdateApi constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_rest_routes' ) );
	}

	/**
	 * Register the REST API routes.
	 */
	public static function register_rest_routes() {
		register_rest_route(
			'jp-e2e/v1',
			'/beta-autoupdate',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => __CLASS__ . '::trigger_autoupdate',
				'permission_callback' => __CLASS__ . '::autoupdate_permissions_check',
			)
		);
	}

	/**
	 * Callback for the /beta-autoupdate endpoint.
	 */
	public static function trigger_autoupdate() {
		$result = array( 'is_set_to_autoupdate' => false );
		if ( Utils::is_set_to_autoupdate() ) {
			$result['is_set_to_autoupdate'] = true;

			$plugins = array_keys( Utils::plugins_needing_update() );
			if ( ! $plugins ) {
				$result['plugins_needing_update'] = false;
			} else {
				$result['plugins_needing_update'] = $plugins;

				wp_schedule_single_event( time() + 10, 'jetpack_beta_autoupdate_hourly_cron' );
			}
		}

		return rest_ensure_response( $result );
	}

	/**
	 * Check if the current user has permission to trigger autoupdates.
	 */
	public static function autoupdate_permissions_check() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		if ( ! current_user_can( 'activate_plugins' ) ) {
			return new WP_Error(
				'rest_cannot_manage_plugins',
				__( 'Sorry, you are not allowed to manage plugins for this site.', 'e2e' ), // phpcs:ignore WordPress.WP.I18n.TextDomainMismatch
				array( 'status' => rest_authorization_required_code() )
			);
		}
		return true;
	}

}

new E2eJetpackBetaAutoupdateApi();
