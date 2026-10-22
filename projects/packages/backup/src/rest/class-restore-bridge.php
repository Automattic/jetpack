<?php
/**
 * Restore REST bridge — proxies wpcom/v2 /sites/{site}/rewind/restores.
 *
 * @package automattic/jetpack-backup-plugin
 */

namespace Automattic\Jetpack\Backup\V0005\REST;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Status\Host;
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
 *   - GET  /jetpack/v4/rewind/backups/{rewindId}/threats        → known threats in a backup
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
					'rewind_id'           => array(
						'type'     => 'string',
						'required' => true,
					),
					'types'               => array(
						'type'                 => 'object',
						// See the download bridge: `object` alone accepts a
						// JSON list, because WordPress validates it with
						// `is_array()`.
						'additionalProperties' => array( 'type' => 'boolean' ),
					),
					'acknowledge_threats' => array(
						'type'    => 'boolean',
						'default' => false,
					),
				),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/rewind/backups/known-threats',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_backups_known_threats' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'with_clean_rewind_id' => array(
						'type'    => 'boolean',
						'default' => false,
					),
				),
			)
		);

		register_rest_route(
			'jetpack/v4',
			'/rewind/backups/(?P<rewind_id>[0-9.]+)/threats',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_known_threats' ),
				'permission_callback' => array( Rest_Controller::class, 'permission_check' ),
				'args'                => array(
					'rewind_id' => array(
						'type'     => 'string',
						'required' => true,
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

		// WordPress.com skips the known-threats check for signed restores that omit the flag,
		// so only sites that can show the warning send it.
		if ( self::known_threats_available() ) {
			$request_body['acknowledge_threats'] = true === rest_sanitize_boolean( $request->get_param( 'acknowledge_threats' ) );
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

		// Cast because `wp_remote_retrieve_response_code()` hands back
		// whatever the transport put there, and a numeric string fails the
		// strict comparison below. On this route that is the worst place to
		// get it wrong: a restore WordPress.com accepted would be reported
		// as a failure, and the reader would start a second one. The long
		// version is on `Rest_Controller::upstream_error()`.
		$status_code = (int) wp_remote_retrieve_response_code( $response );
		if ( 409 === $status_code ) {
			$refusal = self::threats_refusal( $response );
			if ( null !== $refusal ) {
				return $refusal;
			}
		}
		if ( 200 !== $status_code ) {
			return Rest_Controller::upstream_error(
				$response,
				'restore_initiate_failed',
				__( 'Could not start the backup restore.', 'jetpack-backup-pkg' )
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
			$data = array( 'status' => 500 );

			// The `error` beside it is the whole of what went wrong —
			// "There is already a restore in progress" and its like — and
			// it was being dropped on the floor, leaving a reader who
			// cannot start a second restore with no way to learn why.
			//
			// It arrives as prose with no machine code beside it, which is
			// why `upstream_reason()` sorts on shape rather than on which
			// key a value came from. The v2 route usually turns this
			// answer into a 500 `rewind_error` before it ever reaches us,
			// so what this branch catches is the shape upstream does not.
			$reason = Rest_Controller::upstream_reason( $decoded );
			if ( ! empty( $reason ) ) {
				$data['wpcom'] = $reason;
			}

			return new WP_Error(
				'restore_initiate_failed',
				__( 'Could not start the backup restore.', 'jetpack-backup-pkg' ),
				$data
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
	 * The refusal WordPress.com sends for a backup with unacknowledged known threats, or null for any other 409.
	 *
	 * @param array $response The wp_remote_* response.
	 * @return WP_Error|null
	 */
	private static function threats_refusal( $response ) {
		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $body ) || 'threats_not_acknowledged' !== ( $body['code'] ?? null ) ) {
			return null;
		}

		$data = array( 'status' => 409 );
		if ( isset( $body['data']['known_threats'] ) ) {
			$data['known_threats'] = $body['data']['known_threats'];
		}

		return new WP_Error(
			'threats_not_acknowledged',
			__( 'This backup is known to contain security threats. Acknowledge them to restore it.', 'jetpack-backup-pkg' ),
			$data
		);
	}

	/**
	 * Whether this site checks backups for known threats. Only WoA sites do, for now.
	 *
	 * @return bool
	 */
	public static function known_threats_available() {
		return ( new Host() )->is_woa_site();
	}

	/**
	 * The answer for a site whose known threats can't be read, so the screen restores as before.
	 *
	 * @return WP_Error
	 */
	private static function threats_unavailable() {
		return new WP_Error(
			'threats_unavailable',
			__( 'Known threats are not available for this site.', 'jetpack-backup-pkg' ),
			array( 'status' => 404 )
		);
	}

	/**
	 * Known Scan threat counts for the newest 100 backups, by backup period, and the newest
	 * backup without known threats. Proxies GET wpcom/v3 /sites/{blog_id}/rewind/backups.
	 *
	 * Without Scan, or off WoA, the answer is `threats_unavailable` and the dashboard shows no badges.
	 *
	 * @param WP_REST_Request $request The REST request; `with_clean_rewind_id` also finds when the clean backup finished.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_backups_known_threats( WP_REST_Request $request ) {
		if ( ! self::known_threats_available() ) {
			return self::threats_unavailable();
		}

		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/backups?number=100&page=1&known_threats_only=true', $blog_id ),
			'3',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return Rest_Controller::transport_error( $response, 'known_threats_fetch_failed' );
		}

		$status_code = (int) wp_remote_retrieve_response_code( $response );
		if ( 403 === $status_code ) {
			return self::threats_unavailable();
		}
		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( 200 !== $status_code || ! is_array( $body ) ) {
			return Rest_Controller::upstream_error(
				$response,
				'known_threats_fetch_failed',
				__( 'Could not fetch the known threats for this backup.', 'jetpack-backup-pkg' )
			);
		}

		$backups = array();
		foreach ( (array) ( $body['backups'] ?? array() ) as $backup ) {
			if ( ! isset( $backup['object']['backup_period'] ) || ! is_numeric( $backup['object']['backup_period'] ) ) {
				continue;
			}
			$known_threats = $backup['object']['known_threats'] ?? null;
			$backups[]     = array(
				'period'        => (int) $backup['object']['backup_period'],
				'known_threats' => is_array( $known_threats ) ? $known_threats : null,
			);
		}

		$latest_clean = $body['latest_without_known_threats'] ?? null;
		$latest_clean = is_numeric( $latest_clean ) ? (int) $latest_clean : null;

		$latest_clean_rewind_id = null;
		if ( null !== $latest_clean && true === rest_sanitize_boolean( $request->get_param( 'with_clean_rewind_id' ) ) ) {
			$latest_clean_rewind_id = self::backup_complete_rewind_id( $blog_id, $latest_clean, array_column( $backups, 'period' ) );
		}

		return rest_ensure_response(
			array(
				'backups'                                => $backups,
				'latest_without_known_threats'           => $latest_clean,
				'latest_without_known_threats_rewind_id' => $latest_clean_rewind_id,
			)
		);
	}

	/**
	 * The rewind id of a backup's "Backup complete" Activity Log entry: when it finished, the time
	 * the backup lists show. A backup's period is when it started.
	 *
	 * @param int   $blog_id The site's WordPress.com blog id.
	 * @param int   $period  The backup period.
	 * @param int[] $periods The other known backup periods; the next one bounds the search.
	 * @return string|null The rewind id, or null when it can't be found.
	 */
	private static function backup_complete_rewind_id( $blog_id, $period, array $periods ) {
		// A finished backup's entry never changes; "not found yet" is kept only briefly.
		$cache_key = sprintf( 'jetpack_backup_complete_rewind_id_%d_%d', $blog_id, $period );
		$cached    = get_transient( $cache_key );
		if ( is_string( $cached ) ) {
			return '' === $cached ? null : $cached;
		}

		$next = DAY_IN_SECONDS + $period;
		foreach ( $periods as $candidate ) {
			if ( $candidate > $period && $candidate < $next ) {
				$next = $candidate;
			}
		}

		$query = http_build_query(
			array(
				'name'       => array(
					'rewind__backup_complete_full',
					'rewind__backup_complete_initial',
					'rewind__backup_only_complete_full',
					'rewind__backup_only_complete_initial',
				),
				'after'      => gmdate( 'c', $period ),
				'before'     => gmdate( 'c', $next ),
				'sort_order' => 'asc',
				'number'     => 10,
			)
		);

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/activity/rewindable?%s', $blog_id, $query ),
			'v2',
			array(),
			null,
			'wpcom'
		);
		if ( is_wp_error( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		foreach ( (array) ( $body['current']['orderedItems'] ?? array() ) as $item ) {
			$rewind_id = $item['rewind_id'] ?? null;
			if ( is_numeric( $rewind_id ) && (int) floor( (float) $rewind_id ) >= $period ) {
				set_transient( $cache_key, (string) $rewind_id, MONTH_IN_SECONDS );
				return (string) $rewind_id;
			}
		}
		set_transient( $cache_key, '', 5 * MINUTE_IN_SECONDS );
		return null;
	}

	/**
	 * Known Scan threats in a backup. Proxies GET wpcom/v2 /sites/{blog_id}/rewind/backups/{rewind_id}/threats.
	 *
	 * Without Scan (a 403 upstream), or off WoA, the answer is a 404 `threats_unavailable`.
	 *
	 * @param WP_REST_Request $request The REST request.
	 * @return \WP_REST_Response|WP_Error
	 */
	public static function get_known_threats( WP_REST_Request $request ) {
		if ( ! self::known_threats_available() ) {
			return self::threats_unavailable();
		}

		$blog_id = Rest_Controller::get_blog_id_or_error();
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/rewind/backups/%s/threats', $blog_id, rawurlencode( (string) $request->get_param( 'rewind_id' ) ) ),
			'v2',
			array(),
			null,
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return Rest_Controller::transport_error( $response, 'known_threats_fetch_failed' );
		}

		$status_code = (int) wp_remote_retrieve_response_code( $response );
		if ( 403 === $status_code ) {
			return self::threats_unavailable();
		}
		if ( 200 !== $status_code ) {
			return Rest_Controller::upstream_error(
				$response,
				'known_threats_fetch_failed',
				__( 'Could not fetch the known threats for this backup.', 'jetpack-backup-pkg' )
			);
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $body ) ) {
			return new WP_Error(
				'known_threats_fetch_failed',
				__( 'Could not fetch the known threats for this backup.', 'jetpack-backup-pkg' ),
				array( 'status' => 502 )
			);
		}

		return rest_ensure_response( $body );
	}

	/**
	 * WPCOM's restore statuses, mapped to the vocabulary the client uses.
	 *
	 * Two engines write this field and the v2 route serves whichever ran:
	 * a Rewind restore — which is every restore this package starts —
	 * reports `queued | running | finished | fail`, a legacy VaultPress one
	 * `success | success-with-errors | aborted`.
	 *
	 * The Rewind half comes from Calypso's typed contract for this same
	 * endpoint, not from the v1 endpoint's docblock: that list omits
	 * `finished`, so every successful restore once reported `unknown`.
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
		'queued'              => 'queued',
		'running'             => 'running',
		'finished'            => 'finished',
		'fail'                => 'failed',
		'success'             => 'finished',
		'success-with-errors' => 'finished-with-errors',
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

		// Cast, as in `initiate_restore()`. Both branches below depend on
		// it: an uncast `'404'` would miss the queued-restore carve-out as
		// well as the success test, so the ordinary opening seconds of a
		// restore would surface as an error.
		$status_code = (int) wp_remote_retrieve_response_code( $response );

		// A 404 is the normal first answer, not a failure. A restore that
		// has just been queued is not visible to this route yet, and the
		// id may not even exist on our side (see `initiate_restore`, where
		// VaultPress can decline to echo one). Reporting it as an error
		// would turn the ordinary opening seconds of every restore into a
		// user-visible failure.
		//
		// Reported as `not-found` and never as `queued`, which upstream
		// also returns: the client reads the two the same way on screen
		// but must not treat "no record of it" as a sign of life.
		//
		// Safe to treat softly only because the upstream route now
		// answers 502 for an unparseable VaultPress reply — before that, a
		// 404 could quietly have meant "upstream is down".
		if ( 404 === $status_code ) {
			return rest_ensure_response( self::project_status( array(), $restore_id, 'not-found' ) );
		}

		if ( 200 !== $status_code ) {
			return Rest_Controller::upstream_error(
				$response,
				'restore_status_fetch_failed',
				__( 'Could not fetch restore progress.', 'jetpack-backup-pkg' )
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
			// A record that arrived without a status is queued and has not
			// started reporting. An empty payload is not a record, and
			// calling it `queued` would claim upstream is holding a
			// restore it never mentioned — enough to refuse the reader a
			// new one. Tested on emptiness rather than on one key, so a
			// record spelled with fields we do not read still counts.
			$mapped = empty( $status ) ? 'not-found' : 'queued';
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
