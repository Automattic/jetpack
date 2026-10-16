<?php
/**
 * Retention REST bridge — changes how many days of backups WordPress.com keeps.
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
 * Writes the retention period. The read is `retention_days` on the legacy `/site/backup/size`.
 */
class Retention_Bridge {

	/**
	 * The periods Jetpack Cloud offers. WordPress.com also accepts 2, which only its own downgrade sets.
	 *
	 * @var int[]
	 */
	const RETENTION_DAYS = array( 7, 30, 120, 365 );

	/**
	 * Register the POST /jetpack/v4/site/backup/retention route.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/site/backup/retention',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'update_retention' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'retention_days' => array(
						'description' => __( 'Days of backups to keep.', 'jetpack-backup-pkg' ),
						'type'        => 'integer',
						'required'    => true,
						'enum'        => self::RETENTION_DAYS,
					),
				),
			)
		);
	}

	/**
	 * Proxy `POST /sites/{id}/backup/retention/update` (v2). It refuses blog tokens, so this signs as the user.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return \WP_REST_Response|WP_Error The new retention, or WP_Error on failure.
	 */
	public static function update_retention( WP_REST_Request $request ) {
		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$days = (int) $request->get_param( 'retention_days' );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/backup/retention/update', $blog_id ),
			'v2',
			array( 'method' => 'POST' ),
			array( 'retention_days' => $days ),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return Rest_Controller::transport_error( $response, 'retention_update_failed' );
		}

		$message = __( 'Could not change how long backups are kept.', 'jetpack-backup-pkg' );

		if ( 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return Rest_Controller::upstream_error( $response, 'retention_update_failed', $message );
		}

		$decoded = json_decode( wp_remote_retrieve_body( $response ), true );

		// A VaultPress refusal arrives as a 200 with `success: false`.
		if ( ! is_array( $decoded ) || empty( $decoded['success'] ) ) {
			$data   = array( 'status' => 500 );
			$reason = Rest_Controller::upstream_reason( is_array( $decoded ) ? $decoded : array() );
			if ( ! empty( $reason ) ) {
				$data['wpcom'] = $reason;
			}

			return new WP_Error( 'retention_update_failed', $message, $data );
		}

		return rest_ensure_response(
			array(
				'ok'             => true,
				'retention_days' => $days,
			)
		);
	}
}
