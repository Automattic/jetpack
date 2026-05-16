<?php
/**
 * Activity log REST bridge — proxies /sites/{id}/activity/rewindable.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use Automattic\Jetpack\Connection\Client;
use Jetpack_Options;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Powers the modernized Overview's activity list. Forwards the raw
 * WPCOM rewindable-activity response; the React layer's
 * `normalize/activity-log.ts` converts entries to `ActivityItem` shape.
 */
class Activity_Log_Bridge {

	/**
	 * Register routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/activity-log',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_activity_log' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'number'    => array( 'type' => 'integer' ),
					'aggregate' => array( 'type' => 'boolean' ),
					'after'     => array( 'type' => 'string' ),
					'before'    => array( 'type' => 'string' ),
				),
			)
		);
	}

	/**
	 * Proxy the WPCOM rewindable activity log.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_activity_log( WP_REST_Request $request ) {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$query = array_filter(
			array(
				'number'    => $request->get_param( 'number' ),
				'aggregate' => $request->get_param( 'aggregate' ) ? 'true' : null,
				'after'     => $request->get_param( 'after' ),
				'before'    => $request->get_param( 'before' ),
			),
			static function ( $value ) {
				return null !== $value && '' !== $value;
			}
		);

		$endpoint = sprintf( '/sites/%d/activity/rewindable', $blog_id );
		if ( ! empty( $query ) ) {
			$endpoint .= '?' . http_build_query( $query );
		}

		$response = Client::wpcom_json_api_request_as_user(
			$endpoint,
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
				'activity_log_fetch_failed',
				__( 'Could not fetch the site activity log.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		return rest_ensure_response( json_decode( wp_remote_retrieve_body( $response ), true ) );
	}
}
