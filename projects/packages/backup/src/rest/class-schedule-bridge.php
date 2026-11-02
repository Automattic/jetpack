<?php
/**
 * Schedule REST bridge — changes the hour WordPress.com backs the site up.
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
 * Writes the daily backup time. The read is the legacy `GET` on the same path.
 */
class Schedule_Bridge {

	/**
	 * Register the POST /jetpack/v4/site/backup/schedule route.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/site/backup/schedule',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'update_schedule' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'schedule_hour' => array(
						'description' => __( 'Hour of the day, in UTC, the daily backup starts.', 'jetpack-backup-pkg' ),
						'type'        => 'integer',
						'required'    => true,
						'minimum'     => 0,
						'maximum'     => 23,
					),
				),
			)
		);
	}

	/**
	 * Proxy `POST /sites/{id}/rewind/scheduled` (v2). It refuses blog tokens, so this signs as the user.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return \WP_REST_Response|WP_Error The new schedule, or WP_Error on failure.
	 */
	public static function update_schedule( WP_REST_Request $request ) {
		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$hour = (int) $request->get_param( 'schedule_hour' );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/scheduled', $blog_id ),
			'v2',
			array( 'method' => 'POST' ),
			array( 'schedule_hour' => $hour ),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return Rest_Controller::transport_error( $response, 'schedule_update_failed' );
		}

		$message = __( 'Could not change the backup time.', 'jetpack-backup-pkg' );

		if ( 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return Rest_Controller::upstream_error( $response, 'schedule_update_failed', $message );
		}

		$decoded = json_decode( wp_remote_retrieve_body( $response ), true );

		// WordPress.com's own success flag rides inside the 200.
		if ( ! is_array( $decoded ) || empty( $decoded['ok'] ) ) {
			$data   = array( 'status' => 500 );
			$reason = Rest_Controller::upstream_reason( is_array( $decoded ) ? $decoded : array() );
			if ( ! empty( $reason ) ) {
				$data['wpcom'] = $reason;
			}

			return new WP_Error( 'schedule_update_failed', $message, $data );
		}

		return rest_ensure_response(
			array(
				'ok'             => true,
				'scheduled_hour' => $hour,
			)
		);
	}
}
