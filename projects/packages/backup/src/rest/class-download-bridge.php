<?php
/**
 * Download REST bridge — proxies the /sites/{id}/rewind/downloads
 * collection and its per-download status.
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
 * Download endpoints powering the Download screen:
 *   - POST /jetpack/v4/backups/download/{rewindId}            → ask WPCOM to build the archive
 *   - GET  /jetpack/v4/backups/download/{rewindId}/status     → poll progress
 *   - GET  /jetpack/v4/backups/downloads                      → find a download already under way
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
					'rewind_id'         => array(
						'type'     => 'string',
						'required' => true,
					),
					'types'             => array(
						'type'                 => 'object',
						// Values must be booleans. WordPress validates
						// `object` with `rest_is_object()`, which is just
						// `is_array()`, so without this a JSON list of
						// category names passes and reaches WPCOM as a list
						// whose numeric keys it reads as category names.
						// This rejects that with a 400 before the callback
						// runs; `Rest_Controller::named_types()` makes the
						// shape guarantee that a value check cannot.
						'additionalProperties' => array( 'type' => 'boolean' ),
					),
					// Opaque `/rewind/backup/ls` entry ids, only meaningful
					// alongside `types: { paths: true }` — see `initiate_download()`.
					'include_path_list' => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
					'exclude_path_list' => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
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

		register_rest_route(
			'jetpack/v4',
			'/backups/downloads',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_downloads' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
			)
		);
	}

	/**
	 * Initiate a backup download.
	 *
	 * Proxies POST wpcom/v2 /sites/{id}/rewind/downloads. The previous
	 * target — a `prepare-download` path under the backup — is not a
	 * registered route and answered `rest_no_route` on every site tested,
	 * so the Download screen could never have worked.
	 *
	 * The rewind id travels in the request **body**, in full. It is not a
	 * path segment here, and truncating its decimal suffix would address
	 * a different backup than the one the reader picked.
	 *
	 * Returns `{ id }` for the React layer (the WPCOM key is `downloadId`).
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function initiate_download( WP_REST_Request $request ) {
		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}
		$rewind_id = (string) $request->get_param( 'rewind_id' );
		$types     = $request->get_param( 'types' );

		$named_types = Rest_Controller::named_types( $types );
		$include     = self::path_list( $request, 'include_path_list' );
		$exclude     = self::path_list( $request, 'exclude_path_list' );

		// Nothing upstream checks this pairing: VaultPress reads the path
		// lists only for the `paths` type, so a list beside any other
		// category answers 200 with a *full-site* archive.
		//
		// `has_param()` too, for both keys: `path_list()` trims a blank list
		// away, and a caller that named files must not fall through as one
		// that named none.
		if ( $include || $exclude
			|| $request->has_param( 'include_path_list' )
			|| $request->has_param( 'exclude_path_list' ) ) {
			if ( array( 'paths' ) !== array_keys( $named_types ) ) {
				return new WP_Error(
					'path_list_needs_paths_type',
					__( 'A file selection can only be downloaded on its own.', 'jetpack-backup-pkg' ),
					array( 'status' => 400 )
				);
			}
		}

		if ( ! $include && ! $exclude && isset( $named_types['paths'] ) ) {
			// The mirror image, and just as silent upstream: `paths` with
			// nothing to scope it by yields an archive of everything.
			return new WP_Error(
				'paths_type_needs_path_list',
				__( 'No files were named for this download.', 'jetpack-backup-pkg' ),
				array( 'status' => 400 )
			);
		}

		// A supplied `types` that names nothing is refused rather than
		// dropped. Omitting the key is not "download nothing" — WPCOM
		// reads an absent `types` as every category, so forwarding an
		// empty selection as an omission would hand back the full archive
		// the caller had just excluded. `/rewind/downloads` has no
		// server-side guard of its own, unlike the v2 restore route.
		if ( Rest_Controller::request_names_no_types( $request ) ) {
			return new WP_Error(
				'no_types_selected',
				__( 'Select at least one item to download.', 'jetpack-backup-pkg' ),
				array( 'status' => 400 )
			);
		}

		$body = array( 'rewindId' => $rewind_id );
		// Absent when the caller named no categories at all, which is how
		// a whole-archive download is spelled upstream.
		if ( ! empty( $named_types ) ) {
			$body['types'] = $named_types;
		}
		// Arrays, not the comma-joined string upstream also takes: that branch
		// sanitises the whole string before splitting, so `"a, b"` arrives as `" b"`.
		if ( $include ) {
			$body['include_path_list'] = $include;
		}
		if ( $exclude ) {
			$body['exclude_path_list'] = $exclude;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/downloads', $blog_id ),
			'v2',
			array( 'method' => 'POST' ),
			$body,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return Rest_Controller::transport_error( $response, 'download_initiate_failed' );
		}

		// Cast because `wp_remote_retrieve_response_code()` hands back
		// whatever the transport put there, and a numeric string fails the
		// strict comparison below — routing a perfectly good response into
		// the failure branch, where `upstream_error()`'s clamp then reports
		// it as a 500. Same reasoning at every bridge; the long version is
		// on `Rest_Controller::upstream_error()`.
		$status_code = (int) wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return Rest_Controller::upstream_error(
				$response,
				'download_initiate_failed',
				__( 'Could not start the backup download.', 'jetpack-backup-pkg' )
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

		// While one download builds, WPCOM answers every request with that one, whichever backup it is of.
		if ( isset( $body['rewindId'] ) && ! self::is_same_backup( $body['rewindId'], $rewind_id ) ) {
			return new WP_Error(
				'download_in_progress',
				__( 'Another download is being prepared for this site. Try again once it finishes.', 'jetpack-backup-pkg' ),
				array( 'status' => 409 )
			);
		}

		return rest_ensure_response( array( 'id' => $download_id ) );
	}

	/**
	 * One path-list parameter as a clean list of entries.
	 *
	 * Entries are trimmed and empties dropped, and the result is a PHP
	 * list so `wp_json_encode()` emits a JSON array rather than an object.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @param string          $key     Parameter name.
	 * @return string[] The entries, empty when the parameter is absent or names nothing.
	 */
	private static function path_list( WP_REST_Request $request, $key ) {
		$value = $request->get_param( $key );
		if ( ! is_array( $value ) ) {
			return array();
		}

		$entries = array();
		foreach ( $value as $entry ) {
			if ( ! is_scalar( $entry ) ) {
				continue;
			}
			$entry = trim( (string) $entry );
			if ( '' !== $entry ) {
				$entries[] = $entry;
			}
		}
		return $entries;
	}

	/**
	 * Poll download status.
	 *
	 * Proxies GET wpcom/v2 /sites/{id}/rewind/downloads/{downloadId}. The
	 * rewind id is not part of the upstream path — it is kept on our own
	 * route because the client keys its poll cache on (rewindId,
	 * downloadId), and because it keeps the two download routes
	 * symmetrical.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_download_status( WP_REST_Request $request ) {
		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}
		$download_id = (int) $request->get_param( 'download_id' );

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/downloads/%d', $blog_id, $download_id ),
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return Rest_Controller::transport_error( $response, 'download_status_fetch_failed' );
		}

		// Cast, as in `initiate_download()`.
		$status_code = (int) wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return Rest_Controller::upstream_error(
				$response,
				'download_status_fetch_failed',
				__( 'Could not fetch download status.', 'jetpack-backup-pkg' )
			);
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		return rest_ensure_response( self::project_download( is_array( $body ) ? $body : array(), $download_id ) );
	}

	/**
	 * The site's latest downloads, so a reload can find one already under way.
	 *
	 * Proxies GET wpcom/v2 /sites/{id}/rewind/downloads, which lists the latest download not yet dismissed.
	 *
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_downloads() {
		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/downloads', $blog_id ),
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return Rest_Controller::transport_error( $response, 'download_list_fetch_failed' );
		}

		// Cast, as in `initiate_download()`.
		$status_code = (int) wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return Rest_Controller::upstream_error(
				$response,
				'download_list_fetch_failed',
				__( 'Could not fetch download status.', 'jetpack-backup-pkg' )
			);
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! wp_is_numeric_array( $body ) ) {
			return new WP_Error(
				'download_list_fetch_failed',
				__( 'Could not fetch download status.', 'jetpack-backup-pkg' ),
				array( 'status' => 500 )
			);
		}

		$downloads = array();
		foreach ( $body as $download ) {
			if ( is_array( $download ) ) {
				$downloads[] = self::project_download( $download, 0 );
			}
		}

		return rest_ensure_response( $downloads );
	}

	/**
	 * Shape one WPCOM download for the client.
	 *
	 * WPCOM's payload carries **no status field**: it attaches keys by
	 * branch — `url` and `validUntil` once the archive is ready, `error`
	 * when it failed, and `progress` only while it is still being built.
	 *
	 * @param array $body        One download as WPCOM sent it.
	 * @param int   $download_id The id to report when the payload names none.
	 * @return array The projected download.
	 */
	private static function project_download( array $body, $download_id ) {
		$error   = isset( $body['error'] ) ? (string) $body['error'] : '';
		$raw_url = isset( $body['url'] ) ? (string) $body['url'] : '';

		// The client puts this straight into an `<a href>`, and React does
		// not strip dangerous schemes — so check before handing it over.
		//
		// Deliberately a scheme check rather than `wp_http_validate_url()`,
		// which the file-browser bridge uses: that one is built for URLs
		// *this server* is about to fetch, so it also does a DNS lookup and
		// rejects private IPs and non-standard ports. Right there, wrong
		// here — this URL is only ever loaded by the browser, so those
		// rules could reject a perfectly good host while costing a DNS
		// lookup on every poll.
		$scheme = '' === $raw_url ? null : wp_parse_url( $raw_url, PHP_URL_SCHEME );
		$url    = ( 'https' === $scheme || 'http' === $scheme ) ? $raw_url : '';

		// Order matters: a failed download can still carry a stale `url`
		// from an earlier attempt, so the error branch is checked first.
		if ( '' !== $error ) {
			$status = 'failed';
		} elseif ( '' !== $url ) {
			$status = 'finished';
		} elseif ( '' !== $raw_url ) {
			// A URL arrived but is not one we will hand to the browser.
			// Reported as a failure rather than left to fall through to
			// `running`, which would poll forever against a download that
			// is in fact finished.
			$status = 'failed';
			$error  = __( 'The download link could not be used.', 'jetpack-backup-pkg' );
		} elseif ( isset( $body['validUntil'] ) ) {
			// WPCOM withdraws the link once it lapses, but keeps its expiry.
			$status = 'expired';
		} else {
			$status = 'running';
		}

		return array(
			'id'          => isset( $body['downloadId'] ) ? (int) $body['downloadId'] : $download_id,
			'rewind_id'   => isset( $body['rewindId'] ) && is_scalar( $body['rewindId'] ) ? (string) $body['rewindId'] : '',
			'status'      => $status,
			// 0-100, absent once the download leaves the in-flight branch. Clamped, not
			// trusted: the client hands it straight to a progress bar.
			'progress'    => isset( $body['progress'] ) ? max( 0, min( 100, (int) $body['progress'] ) ) : 0,
			'url'         => $url,
			'valid_until' => isset( $body['validUntil'] ) ? (string) $body['validUntil'] : '',
			'error'       => $error,
		);
	}

	/**
	 * Whether the rewind id WPCOM echoed names the backup that was asked for.
	 *
	 * Compared as numbers too, so a trailing zero or a JSON number still matches.
	 *
	 * @param mixed  $echoed    The rewind id WPCOM answered with.
	 * @param string $requested The rewind id this request sent.
	 * @return bool True when both name the same backup.
	 */
	private static function is_same_backup( $echoed, $requested ) {
		return is_scalar( $echoed ) && (
			(string) $echoed === $requested
			|| ( is_numeric( $echoed ) && is_numeric( $requested ) && (float) $echoed === (float) $requested )
		);
	}
}
