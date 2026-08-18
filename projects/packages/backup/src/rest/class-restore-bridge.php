<?php
/**
 * Restore REST bridge — proxies wpcom/v2 /sites/{site}/rewind/restores.
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
 * Restore endpoints powering the Restore screen:
 *   - POST /jetpack/v4/rewind/to/{rewindId}                     → initiate restore
 *   - GET  /jetpack/v4/rewind/restore/{restoreId}/status        → poll status
 */
class Restore_Bridge {

	/**
	 * Register routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			'jetpack/v4',
			'/rewind/to/(?P<rewind_id>[A-Za-z0-9.\-]+)',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'initiate_restore' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'rewind_id' => array(
						'type'     => 'string',
						'required' => true,
					),
					'types'     => array(
						'type'                 => 'object',
						// See the download bridge: `object` alone accepts a
						// JSON list, because WordPress validates it with
						// `is_array()`.
						'additionalProperties' => array( 'type' => 'boolean' ),
					),
				),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/rewind/restore/(?P<restore_id>\d+)/status',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_restore_status' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'restore_id' => array(
						'type'     => 'integer',
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * Initiate a restore.
	 *
	 * Proxies POST wpcom/v2 /sites/{blog_id}/rewind/restores.
	 *
	 * This route exists because the v1 activity-log endpoint this used to
	 * call could never work from wp-admin: the v1 JSON API discards
	 * Jetpack user tokens by design, so `can_rewind()` evaluated an empty
	 * user and every request came back 401. The permission rule is the
	 * same on both — v1 simply had nobody logged in.
	 *
	 * Signed as the user, and that is not incidental: the guard upstream
	 * is `can_rewind()`, which needs `upload_files` and `delete_users`
	 * for a specific user id, so a bare blog token has no capabilities to
	 * evaluate and is rejected. It is also the right answer on its own
	 * terms — a restore is destructive and the activity log names the
	 * person who started it.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function initiate_restore( WP_REST_Request $request ) {
		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}
		$rewind_id = (string) $request->get_param( 'rewind_id' );
		$types     = $request->get_param( 'types' );

		// A supplied `types` that names nothing is refused rather than
		// dropped, and this is the screen where that matters most: an
		// absent `types` means every category upstream, so forwarding an
		// empty selection as an omission would overwrite the live site
		// with exactly the parts the caller excluded.
		//
		// The v2 route this now calls rejects it too, so there are two
		// lines of defence — but this is the one that matters, since the
		// other only fires after the request has left the site.
		if ( Rest_Controller::request_names_no_types( $request ) ) {
			return new WP_Error(
				'no_types_selected',
				__( 'Select at least one item to restore.', 'jetpack-backup-pkg' ),
				array( 'status' => 400 )
			);
		}

		// The rewind id travels in the body, in full. The decimal suffix is
		// significant — it is passed straight to VaultPress as the backup's
		// timestamp, and truncating it addresses a different backup than
		// the reader picked. (`toIntRewindId` belongs to the file-browser
		// URL family only, whose route regex really is `\d+`.)
		$request_body = array(
			'rewindId'     => $rewind_id,
			// Optional upstream, and it now defaults to false — but both
			// this dashboard and Calypso have always sent true, so omitting
			// it would be a silent behaviour change for existing callers.
			'force_rewind' => true,
		);

		// Absent when the caller named no categories at all, which is how
		// a whole-site restore is spelled upstream. Rebuilt as a named map
		// otherwise — the same contract the download bridge follows.
		$named_types = Rest_Controller::named_types( $types );
		if ( ! empty( $named_types ) ) {
			$request_body['types'] = $named_types;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/restores', $blog_id ),
			'v2',
			array( 'method' => 'POST' ),
			$request_body,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return Rest_Controller::transport_error( $response, 'restore_initiate_failed' );
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		if ( 200 !== $status_code ) {
			return new WP_Error(
				'restore_initiate_failed',
				__( 'Could not start the backup restore.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		$decoded = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $decoded ) ) {
			$decoded = array();
		}

		// `ok` is the success signal, not the presence of an id.
		//
		// VaultPress does not reliably echo a restore id back — the
		// underlying call's documented response is only `{ ok, error }` —
		// so `restore_id: null` means "queued, id not known yet", which is
		// a perfectly good outcome. Reading the id as the signal reported
		// a successfully queued restore as a 500, and could not have
		// distinguished the two cases anyway: `(int) null` and `(int) 0`
		// are both `0`.
		if ( empty( $decoded['ok'] ) ) {
			return new WP_Error(
				'restore_initiate_failed',
				__( 'Could not start the backup restore.', 'jetpack-backup-pkg' ),
				array( 'status' => 500 )
			);
		}

		$restore_id_in = isset( $decoded['restore_id'] ) && null !== $decoded['restore_id']
			? (int) $decoded['restore_id']
			: null;

		return rest_ensure_response(
			array(
				// Null is meaningful here and the client branches on it:
				// the restore is running, and its id has to be recovered
				// from the restores collection before progress can be
				// polled.
				'id'        => $restore_id_in,
				'rewind_id' => isset( $decoded['rewind_id'] ) ? (string) $decoded['rewind_id'] : $rewind_id,
			)
		);
	}

	/**
	 * WPCOM's restore statuses, mapped to the vocabulary the client uses.
	 *
	 * The client used to test for `in-progress`, `queued`, `finished` and
	 * `failed`, none of which WPCOM has ever returned — so the poll never
	 * recognised a live restore and no terminal state was reachable. That
	 * went unnoticed because the v1 call this bridge used to make answered
	 * 401 before any status could come back.
	 *
	 * Mapped here rather than in the client for the same reason the
	 * download bridge derives its own status: the wire vocabulary is
	 * WPCOM's to change, and one place to change it is better than three
	 * string comparisons scattered through a state machine.
	 *
	 * `success-with-errors` is deliberately kept distinct instead of being
	 * folded into either neighbour. A restore that completed but not
	 * cleanly is neither a success the reader should walk away from nor a
	 * failure they should retry blindly.
	 *
	 * @var array<string, string>
	 */
	private const STATUS_MAP = array(
		'running'             => 'running',
		'success'             => 'finished',
		'success-with-errors' => 'finished-with-errors',
		'fail'                => 'failed',
		'aborted'             => 'aborted',
	);

	/**
	 * Poll restore status.
	 *
	 * Proxies GET wpcom/v2 /sites/{blog_id}/rewind/restores/{restore_id}.
	 *
	 * Signed `as_blog`, unlike its sibling. Starting a restore is
	 * user-attributed and needs a user token; *watching* one does not —
	 * this route falls through to `is_jetpack_authorized_for_site()`, the
	 * same check the already-registered `GET /jetpack/v4/restores` relies
	 * on. That is a real capability gain rather than a shortcut: progress
	 * now survives the initiating user's session and is visible to any
	 * admin, which is exactly the failure mode where someone closes the
	 * tab mid-restore and can never see the outcome again.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_restore_status( WP_REST_Request $request ) {
		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}
		$restore_id = (int) $request->get_param( 'restore_id' );

		$response = Client::wpcom_json_api_request_as_blog(
			sprintf( '/sites/%d/rewind/restores/%d', $blog_id, $restore_id ),
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return Rest_Controller::transport_error( $response, 'restore_status_fetch_failed' );
		}

		$status_code = wp_remote_retrieve_response_code( $response );

		// A 404 is the normal first answer, not a failure. A restore that
		// has just been queued is not visible to this route yet, and the
		// id may not even exist on our side (see `initiate_restore`, where
		// VaultPress can decline to echo one). Reporting it as an error
		// would turn the ordinary opening seconds of every restore into a
		// user-visible failure.
		//
		// Safe to treat softly only because the upstream route now
		// answers 502 for an unparseable VaultPress reply — before that, a
		// 404 could quietly have meant "upstream is down".
		if ( 404 === $status_code ) {
			return rest_ensure_response( self::project_status( array(), $restore_id, 'queued' ) );
		}

		if ( 200 !== $status_code ) {
			return new WP_Error(
				'restore_status_fetch_failed',
				__( 'Could not fetch restore progress.', 'jetpack-backup-pkg' ),
				array( 'status' => is_int( $status_code ) && $status_code > 0 ? $status_code : 500 )
			);
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		// The v2 payload is flat. The old nested `restore_status` unwrap is
		// kept because it is what makes the flat shape work too — the
		// fallback branch is the live path now, not the defensive one.
		$status = is_array( $body ) && isset( $body['restore_status'] ) && is_array( $body['restore_status'] )
			? $body['restore_status']
			: ( is_array( $body ) ? $body : array() );

		return rest_ensure_response( self::project_status( $status, $restore_id ) );
	}

	/**
	 * Shape a restore-status payload for the client.
	 *
	 * @param array       $status   Upstream status fields, possibly empty.
	 * @param int         $fallback Restore id to report when upstream names none.
	 * @param string|null $force    Status to report regardless of the payload.
	 * @return array
	 */
	private static function project_status( array $status, $fallback, $force = null ) {
		$raw = isset( $status['status'] ) ? (string) $status['status'] : '';

		if ( null !== $force ) {
			$mapped = $force;
		} elseif ( '' === $raw ) {
			// Present but silent about status: the restore exists and has
			// not started reporting yet.
			$mapped = 'queued';
		} else {
			// Anything unrecognised is reported as such rather than
			// guessed at. The client keeps polling through `unknown` under
			// a bounded cap, so a status WPCOM adds later degrades into a
			// slower answer instead of a frozen progress bar.
			$mapped = self::STATUS_MAP[ $raw ] ?? 'unknown';
		}

		return array(
			'id'         => isset( $status['restore_id'] ) ? (int) $status['restore_id'] : (int) $fallback,
			'status'     => $mapped,
			'progress'   => isset( $status['percent'] ) ? (float) $status['percent'] : 0,
			'rewind_id'  => isset( $status['rewind_id'] ) ? (string) $status['rewind_id'] : '',
			'error_code' => isset( $status['error_code'] ) ? (string) $status['error_code'] : '',
			'message'    => isset( $status['message'] ) ? (string) $status['message'] : '',
		);
	}
}
