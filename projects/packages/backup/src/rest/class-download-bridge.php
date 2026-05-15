<?php
/**
 * Download REST bridge — proxies /sites/{id}/rewind/backups/* prepare-download
 * + status endpoints.
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
 * Download endpoints powering the Download screen:
 *   - POST /jetpack/v4/backups/download/{rewindId}            → initiate prepare-download
 *   - GET  /jetpack/v4/backups/download/{rewindId}/status     → poll status
 */
class Download_Bridge {

	/**
	 * Register routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/backups/download/(?P<rewind_id>[A-Za-z0-9.\-]+)',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'initiate_download' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'rewind_id' => array(
						'type'     => 'string',
						'required' => true,
					),
					'types'     => array(
						'type' => 'object',
					),
				),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/backups/download/(?P<rewind_id>[A-Za-z0-9.\-]+)/status',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_download_status' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'rewind_id'   => array(
						'type'     => 'string',
						'required' => true,
					),
					'download_id' => array(
						'type'     => 'integer',
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * Initiate a backup download.
	 *
	 * Proxies POST wpcom/v2 /sites/{id}/rewind/backups/{rewindId}/prepare-download.
	 * Returns `{ id }` for the React layer (the WPCOM key is `downloadId`).
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function initiate_download( WP_REST_Request $request ) {
		$blog_id   = Jetpack_Options::get_option( 'id' );
		$rewind_id = (string) $request->get_param( 'rewind_id' );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf(
				'/sites/%d/rewind/backups/%s/prepare-download',
				$blog_id,
				rawurlencode( $rewind_id )
			),
			'v2',
			array( 'method' => 'POST' ),
			array(
				'types' => $request->get_param( 'types' ) ? $request->get_param( 'types' ) : (object) array(),
			),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return new WP_Error(
				'download_initiate_failed',
				__( 'Could not start the backup download.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		$body        = json_decode( wp_remote_retrieve_body( $response ), true );
		$download_id = is_array( $body ) && isset( $body['downloadId'] ) ? (int) $body['downloadId'] : 0;
		if ( ! $download_id ) {
			return new WP_Error(
				'download_initiate_failed',
				__( 'Download response missing download id.', 'jetpack-backup-pkg' ),
				array( 'status' => 500 )
			);
		}

		return rest_ensure_response( array( 'id' => $download_id ) );
	}

	/**
	 * Poll download status.
	 *
	 * Proxies GET wpcom/v2 /sites/{id}/rewind/backups/{rewindId}/downloads/{downloadId}.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_download_status( WP_REST_Request $request ) {
		$blog_id     = Jetpack_Options::get_option( 'id' );
		$rewind_id   = (string) $request->get_param( 'rewind_id' );
		$download_id = (int) $request->get_param( 'download_id' );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf(
				'/sites/%d/rewind/backups/%s/downloads/%d',
				$blog_id,
				rawurlencode( $rewind_id ),
				$download_id
			),
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
				'download_status_fetch_failed',
				__( 'Could not fetch download status.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		return rest_ensure_response( json_decode( wp_remote_retrieve_body( $response ), true ) );
	}
}
