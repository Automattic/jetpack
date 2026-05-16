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
 *   - GET  /jetpack/v4/rewind/backup/file-content → text preview proxy
 *
 * NOTE: WPCOM's `/sites/{id}/rewind/backup/path-info` endpoint was
 * removed from this bridge in 2026-05. It returned "No file found"
 * for every input variant we could synthesize and there's no working
 * caller of it elsewhere in the monorepo; the React layer derives the
 * `lastModified` field from `/ls`'s `period` and the mime type from
 * the file extension instead.
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
			'/rewind/backup/file-content',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_file_content' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'file_period'           => array(
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
	 * Fetch a text file's content for the preview pane.
	 *
	 * Resolves the one-time signed URL from WPCOM, then fetches the
	 * stream server-side and caps the body at PREVIEW_MAX_BYTES.
	 * WPCOM's signed-URL stream endpoint doesn't send CORS headers, so
	 * the browser can't fetch it directly.
	 *
	 * VaultPress stores file content per the file's own snapshot
	 * `period` — the timestamp when the file last changed — not by the
	 * parent backup's rewindId. Files don't get re-snapshotted every
	 * backup, so the `{period}` URL segment below is the per-entry
	 * `period` from `/ls`, never the rewindId of the backup the user
	 * is browsing. Sending the rewindId instead silently produces a
	 * signed URL for a non-existent storage location and 400s with
	 * "File not found" at stream time.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_file_content( WP_REST_Request $request ) {
		$blog_id               = Jetpack_Options::get_option( 'id' );
		$file_period           = (string) $request->get_param( 'file_period' );
		$encoded_manifest_path = (string) $request->get_param( 'encoded_manifest_path' );

		// Step 1: resolve the signed stream URL.
		$url_response = Client::wpcom_json_api_request_as_user(
			sprintf(
				'/sites/%d/rewind/backup/%s/file/%s/url',
				$blog_id,
				rawurlencode( $file_period ),
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
