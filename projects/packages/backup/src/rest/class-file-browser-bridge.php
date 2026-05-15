<?php
/**
 * File browser REST bridge — proxies /sites/{id}/rewind/backup/*.
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
 * File browser endpoints powering the BackupDetail file tree:
 *   - POST /jetpack/v4/rewind/backup/ls           → list folder children
 *   - POST /jetpack/v4/rewind/backup/path-info    → file metadata
 *   - GET  /jetpack/v4/rewind/backup/file-content → text preview proxy
 */
class File_Browser_Bridge {

	/**
	 * Cap on text-preview size (bytes). 64 KB is plenty for wp-config.php,
	 * theme style.css, small SQL dumps.
	 */
	const PREVIEW_MAX_BYTES = 64 * 1024;

	/**
	 * Register routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/rewind/backup/ls',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'list_directory' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'rewind_id' => array(
						'type'     => 'string',
						'required' => true,
					),
					'path'      => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/rewind/backup/path-info',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'get_path_info' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'rewind_id'      => array(
						'type'     => 'string',
						'required' => true,
					),
					'manifest_path'  => array(
						'type'     => 'string',
						'required' => true,
					),
					'extension_type' => array(
						'type' => 'string',
					),
				),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/rewind/backup/file-content',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_file_content' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'rewind_id'             => array(
						'type'     => 'string',
						'required' => true,
					),
					'encoded_manifest_path' => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * List folder children. Proxies POST wpcom/v2 /sites/{id}/rewind/backup/ls.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function list_directory( WP_REST_Request $request ) {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/backup/ls', $blog_id ),
			'v2',
			array( 'method' => 'POST' ),
			array(
				'backup_id' => $request->get_param( 'rewind_id' ),
				'path'      => $request->get_param( 'path' ),
			),
			'wpcom'
		);

		return self::forward_response( $response, 'backup_ls_fetch_failed', __( 'Could not list backup contents.', 'jetpack-backup-pkg' ) );
	}

	/**
	 * Get metadata for a single file. Proxies POST wpcom/v2 /sites/{id}/rewind/backup/path-info.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_path_info( WP_REST_Request $request ) {
		$blog_id = Jetpack_Options::get_option( 'id' );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/backup/path-info', $blog_id ),
			'v2',
			array( 'method' => 'POST' ),
			array(
				'backup_id'      => $request->get_param( 'rewind_id' ),
				'manifest_path'  => $request->get_param( 'manifest_path' ),
				'extension_type' => $request->get_param( 'extension_type' ),
			),
			'wpcom'
		);

		return self::forward_response( $response, 'backup_path_info_fetch_failed', __( 'Could not fetch file metadata.', 'jetpack-backup-pkg' ) );
	}

	/**
	 * Fetch a text file's content for the preview pane.
	 *
	 * Resolves the one-time signed URL from WPCOM, then fetches the
	 * stream server-side and caps the body at PREVIEW_MAX_BYTES.
	 * WPCOM's signed-URL stream endpoint doesn't send CORS headers, so
	 * the browser can't fetch it directly.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_file_content( WP_REST_Request $request ) {
		$blog_id               = Jetpack_Options::get_option( 'id' );
		$rewind_id             = (string) $request->get_param( 'rewind_id' );
		$encoded_manifest_path = (string) $request->get_param( 'encoded_manifest_path' );

		// Step 1: resolve the signed stream URL.
		$url_response = Client::wpcom_json_api_request_as_user(
			sprintf(
				'/sites/%d/rewind/backup/%s/file/%s/url',
				$blog_id,
				rawurlencode( $rewind_id ),
				rawurlencode( $encoded_manifest_path )
			),
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $url_response ) ) {
			return $url_response;
		}

		$url_status = wp_remote_retrieve_response_code( $url_response );
		if ( 200 !== $url_status ) {
			return new WP_Error(
				'backup_file_content_url_failed',
				__( 'Could not resolve file download URL.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $url_status ) && $url_status > 0 ? $url_status : 500 )
			);
		}

		$url_body   = json_decode( wp_remote_retrieve_body( $url_response ), true );
		$signed_url = is_array( $url_body ) && isset( $url_body['url'] ) ? $url_body['url'] : null;
		if ( ! $signed_url ) {
			return new WP_Error(
				'backup_file_content_url_missing',
				__( 'Could not resolve file download URL.', 'jetpack-backup-pkg' ),
				array( 'status' => 502 )
			);
		}

		// Step 2: fetch the stream body server-side.
		$stream_response = wp_remote_get( $signed_url, array( 'timeout' => 15 ) );

		if ( is_wp_error( $stream_response ) ) {
			return $stream_response;
		}

		$stream_status = wp_remote_retrieve_response_code( $stream_response );
		if ( 200 !== $stream_status ) {
			return new WP_Error(
				'backup_file_content_stream_failed',
				__( 'Could not fetch file content.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $stream_status ) && $stream_status > 0 ? $stream_status : 500 )
			);
		}

		$content = wp_remote_retrieve_body( $stream_response );

		if ( strlen( $content ) > self::PREVIEW_MAX_BYTES ) {
			$content = substr( $content, 0, self::PREVIEW_MAX_BYTES );
		}

		return rest_ensure_response( array( 'content' => $content ) );
	}

	/**
	 * Shared response forwarder for the bridges that just pass through
	 * WPCOM JSON. Wraps WP_Error / non-200 responses with bridge-level
	 * error codes the front-end branches on.
	 *
	 * @param array|\WP_Error $response The wp_remote_* response.
	 * @param string          $code     Error code for non-200.
	 * @param string          $message  Translated error message.
	 * @return \WP_REST_Response|WP_Error
	 */
	private static function forward_response( $response, $code, $message ) {
		if ( is_wp_error( $response ) ) {
			return $response;
		}
		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return new WP_Error(
				$code,
				$message,
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}
		return rest_ensure_response( json_decode( wp_remote_retrieve_body( $response ), true ) );
	}
}
