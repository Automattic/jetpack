<?php
/**
 * Activity log REST bridge — proxies /sites/{id}/activity/rewindable.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use Automattic\Jetpack\Connection\Client;
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
		// NOTE: not `/activity-log` — that namespace is owned by the
		// `automattic/jetpack-activity-log` package's REST controller,
		// which is loaded inside the Jetpack plugin. Sharing the route
		// would let `register_rest_route`'s endpoint-merge pick the
		// wrong handler at dispatch time (the two bridges proxy
		// different WPCOM endpoints with different response shapes).
		register_rest_route(
			'jetpack/v4',
			'/site/rewindable-activity',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_activity_log' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				// Bounds mirror what WPCOM's own `get_stream_args()`
				// validate_callback enforces on `/activity/rewindable`, and
				// the sibling `jetpack-activity-log` package's declaration.
				// Declaring them here turns an out-of-range value into a 400
				// with a useful message instead of a round-trip that WPCOM
				// rejects.
				'args'                => array(
					'number' => array(
						'description' => __( 'Number of items to return per page.', 'jetpack-backup-pkg' ),
						'type'        => 'integer',
						'minimum'     => 1,
						'maximum'     => 1000,
					),
					'page'   => array(
						'description' => __( '1-indexed page number.', 'jetpack-backup-pkg' ),
						'type'        => 'integer',
						'minimum'     => 1,
					),
				),
			)
		);
	}

	/**
	 * Proxy the WPCOM rewindable activity log.
	 *
	 * Forwards `number` (per page) and `page` (1-indexed) so the dashboard
	 * paginates against the real server response — `totalItems` /
	 * `totalPages` come back in the WPCOM envelope and drive DataViews'
	 * pagination footer. Same param shape the `automattic/jetpack-activity-log`
	 * package uses against the parent `/sites/{id}/activity` endpoint.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_activity_log( WP_REST_Request $request ) {
		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$query = array_filter(
			array(
				'number'  => $request->get_param( 'number' ),
				'page'    => $request->get_param( 'page' ),
				// Activity summaries are rendered by WPCOM. Without this they
				// come back in English whatever the reader's language is.
				'_locale' => get_user_locale(),
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
			return Rest_Controller::transport_error( $response, 'activity_log_fetch_failed' );
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
