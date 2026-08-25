<?php
/**
 * File browser REST bridge — proxies /sites/{id}/rewind/backup/*.
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
 * File browser endpoints powering the BackupDetail file tree:
 *   - POST /jetpack/v4/rewind/backup/ls           → list folder children
 *   - GET  /jetpack/v4/rewind/backup/file-content → text preview proxy
 *   - GET  /jetpack/v4/rewind/backup/path-info    → per-file metadata
 *
 * All three address a file by the *file's own* `period` from `/ls` —
 * the timestamp at which that file last changed — never by the parent
 * backup's rewindId. VaultPress records one row per file version and
 * matches `period` exactly, with no nearest-earlier fallback, so a
 * file that did not change during the backup the reader is browsing
 * has no row under the backup's own id.
 *
 * Note the two paths take the manifest path in *different* encodings,
 * because the upstream routes do: `path-info` carries it raw in the
 * request body, while `file-content` puts standard base64 in a URL
 * segment that WPCOM `base64_decode()`s. Neither tolerates the other's
 * form.
 */
class File_Browser_Bridge {

	/**
	 * Cap on text-preview size (bytes). 64 KB is plenty for wp-config.php,
	 * theme style.css, small SQL dumps.
	 */
	const PREVIEW_MAX_BYTES = 64 * 1024;

	/**
	 * Standard base64, with optional padding — the exact alphabet, and
	 * nothing else.
	 *
	 * Notably excludes `%` and `.`, which is what makes it safe to
	 * interpolate a matching value into a URL path unescaped.
	 */
	const BASE64_PATTERN = '^[A-Za-z0-9+/]*={0,2}$';

	/**
	 * A snapshot period: Unix seconds, digits only.
	 *
	 * Matches the upstream route's own `(?P<backup_id>\d+)` capture, so
	 * a malformed value fails here with a clear 400 instead of an
	 * opaque upstream 404.
	 */
	const PERIOD_PATTERN = '^[0-9]+$';

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
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_path_info' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'file_period'    => array(
						'type'     => 'string',
						'required' => true,
						'pattern'  => self::PERIOD_PATTERN,
					),
					// Unconstrained on purpose: this one is forwarded in
					// the request body, not the URL, and a manifest path
					// can legitimately contain any byte a filename can.
					'manifest_path'  => array(
						'type'     => 'string',
						'required' => true,
					),
					'extension_type' => array(
						'type'     => 'string',
						'required' => false,
						'default'  => '',
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
						'pattern'  => self::PERIOD_PATTERN,
					),
					// Both of these land in the WPCOM URL *path*, and the
					// manifest path deliberately goes in unescaped, so
					// these patterns are the only guard on it. See
					// `get_file_content()` for why escaping is not an option.
					'encoded_manifest_path' => array(
						'type'     => 'string',
						'required' => true,
						'pattern'  => self::BASE64_PATTERN,
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
		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

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
	 * Read one file's real metadata. Proxies POST wpcom/v2
	 * /sites/{id}/rewind/backup/path-info.
	 *
	 * Gives the info card the `size`, `hash` and `mtime` VaultPress
	 * actually recorded, rather than the snapshot `period` `/ls` carries.
	 * `manifest_filter` comes back too, which is what a future granular
	 * per-file download needs.
	 *
	 * Two fields are deliberately not surfaced. `download_url` is
	 * hardcoded empty upstream behind a TODO, so it says nothing about
	 * whether the bytes exist. And `data_type` is a small integer type
	 * code — the second character of the manifest path — not a mime
	 * type, so it cannot drive the preview decision; the card keeps
	 * deriving that from the file extension, as Calypso does.
	 *
	 * Upstream answers 200 with an `error` string when the file has no
	 * row, so a caller must branch on `error` rather than on the status.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_path_info( WP_REST_Request $request ) {
		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/backup/path-info', $blog_id ),
			'v2',
			array( 'method' => 'POST' ),
			array(
				'backup_id'      => $request->get_param( 'file_period' ),
				'manifest_path'  => $request->get_param( 'manifest_path' ),
				'extension_type' => (string) $request->get_param( 'extension_type' ),
			),
			'wpcom'
		);

		return self::forward_response( $response, 'backup_path_info_failed', __( 'Could not read file details.', 'jetpack-backup-pkg' ) );
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
		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}
		$file_period           = (string) $request->get_param( 'file_period' );
		$encoded_manifest_path = (string) $request->get_param( 'encoded_manifest_path' );

		// Step 1: resolve the signed stream URL.
		//
		// `$encoded_manifest_path` goes in verbatim. It is already
		// base64, and WPCOM's stream route runs a plain
		// `base64_decode()` on this segment, so percent-encoding it
		// first is silently destructive: PHP's non-strict decoder
		// discards the `%` and keeps the `3` and the `D`, both valid
		// base64 characters. `ZjU6L3dwLWNvbmZpZy5waHA%3D` decodes to
		// `f5:/wp-config.php7`, and VaultPress then correctly reports
		// `File not found` for a file that is really there. Base64's
		// `+`, `/` and `=` are all legal in a path segment, and the
		// upstream route captures it as `\S+`, so nothing needs
		// escaping. `$file_period` is digits, so its encoding is a
		// no-op either way.
		//
		// Because nothing escapes it here, `BASE64_PATTERN` on the arg
		// definition is the guard. That matters: cURL applies RFC 3986
		// dot-segment removal before the request leaves the host, so an
		// unconstrained value containing `../` would climb out of this
		// route — with a `?` swallowing the trailing `/url` — and turn
		// a file proxy into an arbitrary authenticated WPCOM GET. The
		// base64 alphabet contains neither `%` nor `.`, so the pattern
		// closes that off without re-breaking the preview.
		$url_response = Client::wpcom_json_api_request_as_user(
			sprintf(
				'/sites/%d/rewind/backup/%s/file/%s/url',
				$blog_id,
				rawurlencode( $file_period ),
				$encoded_manifest_path
			),
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $url_response ) ) {
			return Rest_Controller::transport_error( $url_response, 'backup_file_content_url_failed' );
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
		if ( ! $signed_url || ! wp_http_validate_url( $signed_url ) ) {
			// Defense-in-depth: WPCOM is supposed to hand back an HTTPS
			// URL, but a regression that returned `file://…` or another
			// scheme would otherwise reach `wp_remote_get` below.
			return new WP_Error(
				'backup_file_content_url_missing',
				__( 'Could not resolve file download URL.', 'jetpack-backup-pkg' ),
				array( 'status' => 502 )
			);
		}

		// Step 2: fetch the stream body server-side.
		//
		// `limit_response_size` caps the body at the HTTP-transport
		// layer so a multi-GB blob can't be buffered into PHP memory
		// before truncation. The bridge enforces no mime check at
		// all — the React layer's allowlist is advisory only — so any
		// admin can address any blob the WPCOM signer is willing to
		// hand a URL for.
		$stream_response = wp_remote_get(
			$signed_url,
			array(
				'timeout'             => 15,
				'limit_response_size' => self::PREVIEW_MAX_BYTES,
			)
		);

		if ( is_wp_error( $stream_response ) ) {
			return Rest_Controller::transport_error( $stream_response, 'backup_file_content_stream_failed' );
		}

		$stream_status = wp_remote_retrieve_response_code( $stream_response );
		if ( 200 !== $stream_status ) {
			return new WP_Error(
				'backup_file_content_stream_failed',
				__( 'Could not fetch file content.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $stream_status ) && $stream_status > 0 ? $stream_status : 500 )
			);
		}

		return rest_ensure_response( array( 'content' => wp_remote_retrieve_body( $stream_response ) ) );
	}

	/**
	 * Shared response forwarder for the bridges that just pass through
	 * WPCOM JSON. Wraps transport failures and non-200 responses alike
	 * with bridge-level error codes the front-end branches on, so cURL's
	 * own text never reaches the reader.
	 *
	 * @param array|\WP_Error $response The wp_remote_* response.
	 * @param string          $code     Error code for a transport failure or a non-200.
	 * @param string          $message  Translated error message for a non-200.
	 * @return \WP_REST_Response|WP_Error
	 */
	private static function forward_response( $response, $code, $message ) {
		if ( is_wp_error( $response ) ) {
			return Rest_Controller::transport_error( $response, $code );
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
