<?php
/**
 * Backup sizes REST bridge — proxies WordPress.com's v3 /sites/{id}/rewind/backups.
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
 * Serves each backup's start time and site size, the only per-backup size WordPress.com exposes.
 */
class Backup_Sizes_Bridge {

	/**
	 * The most v3 serves per page; above it, it answers a bare `[]`.
	 */
	const PER_PAGE = 100;

	/**
	 * Register the GET /jetpack/v4/backups/sizes route.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/backups/sizes',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_backup_sizes' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'page' => array(
						'description' => __( '1-indexed page number.', 'jetpack-backup-pkg' ),
						'type'        => 'integer',
						'default'     => 1,
						'minimum'     => 1,
					),
				),
			)
		);
	}

	/**
	 * Proxy one page of backups, newest first. It refuses blog tokens, so this signs as the user.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return \WP_REST_Response|WP_Error Each backup's `period` and `size` in bytes, or WP_Error on failure.
	 */
	public static function get_backup_sizes( WP_REST_Request $request ) {
		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf(
				'/sites/%d/rewind/backups?number=%d&page=%d',
				$blog_id,
				self::PER_PAGE,
				(int) $request->get_param( 'page' )
			),
			'3',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return Rest_Controller::transport_error( $response, 'backup_sizes_fetch_failed' );
		}

		if ( 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return Rest_Controller::upstream_error(
				$response,
				'backup_sizes_fetch_failed',
				__( 'Could not fetch the size of each backup.', 'jetpack-backup-pkg' )
			);
		}

		$decoded = json_decode( wp_remote_retrieve_body( $response ), true );
		$backups = array();

		// Only what the dashboard reads: `backup_stats` alone lists every plugin and table.
		foreach ( (array) ( $decoded['backups'] ?? array() ) as $backup ) {
			if ( ! isset( $backup['object']['backup_period'] ) ) {
				continue;
			}
			$backups[] = array(
				'period' => (int) $backup['object']['backup_period'],
				'size'   => (int) ( $backup['object']['backup_size'] ?? 0 ),
			);
		}

		return rest_ensure_response(
			array(
				'totalPages' => (int) ( $decoded['totalPages'] ?? 0 ),
				'backups'    => $backups,
			)
		);
	}
}
