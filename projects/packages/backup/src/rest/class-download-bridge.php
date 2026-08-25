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
		$named_types = Rest_Controller::named_types( $types );
		if ( ! empty( $named_types ) ) {
			$body['types'] = $named_types;
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
	 * Proxies GET wpcom/v2 /sites/{id}/rewind/downloads/{downloadId}. The
	 * rewind id is not part of the upstream path — it is kept on our own
	 * route because the client keys its poll cache on (rewindId,
	 * downloadId), and because it keeps the two download routes
	 * symmetrical.
	 *
	 * The response is projected rather than forwarded, the way restore
	 * status already is. WPCOM's payload carries **no status field**: it
	 * attaches keys by branch — `url` and `validUntil` once the archive
	 * is ready, `error` when it failed, and `progress` only while the
	 * archive is still being built. Leaving that shape for the client to
	 * interpret is what left the React layer testing three status strings
	 * that never appear in the payload.
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

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return new WP_Error(
				'download_status_fetch_failed',
				__( 'Could not fetch download status.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $body ) ) {
			$body = array();
		}

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
		} else {
			$status = 'running';
		}

		return rest_ensure_response(
			array(
				'id'          => isset( $body['downloadId'] ) ? (int) $body['downloadId'] : $download_id,
				'status'      => $status,
				// 0-100, and absent entirely once the download leaves the
				// in-flight branch. Clamped rather than trusted: the client
				// feeds this straight to a progress bar, and the headline bug
				// this projection replaces was a bar being handed 10000. Making
				// the range true here means no future upstream change can
				// reproduce that symptom.
				'progress'    => isset( $body['progress'] ) ? max( 0, min( 100, (int) $body['progress'] ) ) : 0,
				'url'         => $url,
				'valid_until' => isset( $body['validUntil'] ) ? (string) $body['validUntil'] : '',
				'error'       => $error,
			)
		);
	}
}
