<?php
/**
 * Capabilities REST bridge — proxies WPCOM's site rewind state.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use Automattic\Jetpack\Connection\Client;
use WP_Error;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Returns the site's backup capabilities (plan slug, hasBackupPlan,
 * hasScan). Backs the `<Gates>` decision tree.
 */
class Capabilities_Bridge {

	/**
	 * Register the GET /jetpack/v4/site/capabilities route.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/site/capabilities',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_capabilities' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
			)
		);
	}

	/**
	 * Proxy `/sites/{id}/rewind/capabilities` (v2, as_user) and project
	 * the response into the shape the React layer expects.
	 *
	 * This is the same endpoint the legacy `/jetpack/v4/backup-capabilities`
	 * route hits — it returns a flat `{ capabilities: [...] }` envelope.
	 * The earlier `/rewind?force=wpcom` variant returns site *state*, not
	 * a capabilities list, and on some plan shapes (e.g. Jetpack Complete)
	 * the `capabilities` key is missing entirely, which produced a false
	 * "no plan" gate for plans that do include Backup.
	 *
	 * @return \WP_REST_Response|WP_Error The decoded capabilities, or WP_Error on failure.
	 */
	public static function get_capabilities() {
		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/capabilities', $blog_id ),
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return new WP_Error(
				'capabilities_fetch_failed',
				__( 'Could not fetch site capabilities.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $body ) ) {
			$body = array();
		}

		$capabilities = isset( $body['capabilities'] ) && is_array( $body['capabilities'] )
			? $body['capabilities']
			: array();

		return rest_ensure_response(
			array(
				'hasBackupPlan' => in_array( 'backup', $capabilities, true ),
				'hasScan'       => in_array( 'scan', $capabilities, true ),
			)
		);
	}
}
