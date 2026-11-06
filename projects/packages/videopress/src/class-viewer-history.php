<?php
/**
 * VideoPress viewer history: what each signed-in viewer started, finished or marked.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * History rules, the viewer REST routes, retention and personal-data handling.
 *
 * - Started: playback advanced ( played intervals or a resume position ).
 * - Completed: merged played intervals cover COMPLETION_RATIO of the duration; seeking to the end is not playing it.
 * - Manual watched or unwatched: an explicit override; unwatched also resets progress and bumps the
 *   generation, so delayed events from before the reset are rejected.
 * - Clearing all history bumps the viewer's epoch, which every event must carry.
 * - Legacy seen: imported evidence of unknown completion, never shown as completed.
 *
 * The viewer is always the authenticated user; requests never name one.
 */
class Viewer_History {

	const COMPLETION_RATIO   = 0.9;
	const RETENTION          = 365 * DAY_IN_SECONDS;
	const TOMBSTONE_TTL      = 2 * DAY_IN_SECONDS;
	const EPOCH_META         = '_videopress_history_epoch';
	const PURGE_HOOK         = 'videopress_viewer_history_purge';
	const MAX_SEGMENTS       = 50;
	const MAX_INTERVALS      = 200;
	const MAX_PAGE           = 50;
	const HIDE_LIMIT         = 5000;
	const PICK_ATTEMPTS      = 12;
	const PICK_SCAN          = 100;
	const QUERY_ARG_HIDE     = 'videos-hide';
	const QUERY_ARG_PICK     = 'videopress_unwatched';
	const STATUS_WATCHED     = 'watched';
	const STATUS_IN_PROGRESS = 'in_progress';
	const STATUS_LEGACY      = 'legacy_seen';
	const STATUS_NONE        = 'none';

	/**
	 * The store, once resolved.
	 *
	 * @var History_Store|null
	 */
	private static $store = null;

	/**
	 * Whether init() already ran.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Hook retention, privacy and the viewer script up.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		add_action( self::PURGE_HOOK, array( __CLASS__, 'purge' ) );
		add_action( 'init', array( __CLASS__, 'schedule_purge' ), 20 );
		add_filter( 'wp_privacy_personal_data_exporters', array( __CLASS__, 'register_exporter' ) );
		add_filter( 'wp_privacy_personal_data_erasers', array( __CLASS__, 'register_eraser' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_viewer_script' ) );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_discovery_script' ) );
		add_action( 'template_redirect', array( __CLASS__, 'maybe_pick_unwatched' ) );
		add_action( 'deleted_user', array( __CLASS__, 'forget_user' ) );
	}

	/**
	 * Whether history is collected and shown on this site.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		$enabled = Channel::is_enabled() && null !== self::store();

		/**
		 * Filters whether VideoPress keeps viewer history. Collection and personalized reads switch together.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Defaults to channel sites with a history store.
		 */
		return (bool) apply_filters( 'videopress_viewer_history_enabled', $enabled );
	}

	/**
	 * The history store: the site table off WordPress.com, whatever the host supplies on it.
	 *
	 * @return History_Store|null
	 */
	public static function store() {
		if ( null !== self::$store ) {
			return self::$store;
		}
		$default = defined( 'IS_WPCOM' ) && IS_WPCOM ? null : new Table_History_Store();

		/**
		 * Filters the viewer history store. WordPress.com supplies its own; there is no default there.
		 *
		 * @since $$next-version$$
		 *
		 * @param History_Store|null $store The store.
		 */
		$store       = apply_filters( 'videopress_history_store', $default );
		self::$store = $store instanceof History_Store ? $store : null;
		return self::$store;
	}

	/**
	 * Forget the resolved store ( tests ).
	 *
	 * @return void
	 */
	public static function reset() {
		self::$store = null;
	}

	/**
	 * A viewer's current epoch.
	 *
	 * @param int $user_id Viewer.
	 * @return int
	 */
	public static function epoch( $user_id ) {
		return (int) get_user_meta( (int) $user_id, self::EPOCH_META, true );
	}

	/**
	 * An empty row for a viewer and video.
	 *
	 * @param int    $user_id Viewer.
	 * @param string $guid    GUID.
	 * @return array
	 */
	private static function blank( $user_id, $guid ) {
		return array(
			'user_id'     => (int) $user_id,
			'guid'        => $guid,
			'position_ms' => 0,
			'duration_ms' => 0,
			'watched_ms'  => 0,
			'intervals'   => array(),
			'completed'   => false,
			'manual'      => '',
			'legacy_seen' => false,
			'generation'  => 0,
			'session'     => '',
			'seq'         => 0,
			'deleted'     => false,
			'updated'     => 0,
		);
	}

	/**
	 * Merge played intervals: sorted, overlapping or touching ones joined, clamped to the duration.
	 *
	 * @param array[] $intervals   Intervals as [start, end] ms.
	 * @param int     $duration_ms Duration; 0 when unknown.
	 * @return array[]
	 */
	public static function merge_intervals( array $intervals, $duration_ms ) {
		$clean = array();
		foreach ( $intervals as $interval ) {
			if ( ! is_array( $interval ) || count( $interval ) < 2 || ! is_numeric( $interval[0] ) || ! is_numeric( $interval[1] ) ) {
				continue;
			}
			$start = max( 0, (int) $interval[0] );
			$end   = (int) $interval[1];
			if ( $duration_ms > 0 ) {
				$end = min( $end, (int) $duration_ms );
			}
			if ( $end > $start ) {
				$clean[] = array( $start, $end );
			}
		}
		usort(
			$clean,
			function ( $a, $b ) {
				return $a[0] - $b[0];
			}
		);
		$merged  = array();
		$current = null;
		foreach ( $clean as $interval ) {
			if ( null !== $current && $interval[0] <= $current[1] ) {
				$current[1] = max( $current[1], $interval[1] );
				continue;
			}
			if ( null !== $current ) {
				$merged[] = $current;
			}
			$current = $interval;
		}
		if ( null !== $current ) {
			$merged[] = $current;
		}
		return array_slice( $merged, 0, self::MAX_INTERVALS );
	}

	/**
	 * Total milliseconds covered by merged intervals.
	 *
	 * @param array[] $intervals Merged intervals.
	 * @return int
	 */
	public static function covered( array $intervals ) {
		$total = 0;
		foreach ( $intervals as $interval ) {
			$total += $interval[1] - $interval[0];
		}
		return $total;
	}

	/**
	 * A row's status for display.
	 *
	 * @param array|null $row Row.
	 * @return string One of the STATUS_ constants.
	 */
	public static function status( $row ) {
		if ( ! is_array( $row ) || ! empty( $row['deleted'] ) ) {
			return self::STATUS_NONE;
		}
		if ( 'watched' === $row['manual'] || ( $row['completed'] && 'unwatched' !== $row['manual'] ) ) {
			return self::STATUS_WATCHED;
		}
		if ( $row['watched_ms'] > 0 || $row['position_ms'] > 0 ) {
			return self::STATUS_IN_PROGRESS;
		}
		return $row['legacy_seen'] ? self::STATUS_LEGACY : self::STATUS_NONE;
	}

	/**
	 * Apply one viewer event to their row.
	 *
	 * @param int    $user_id Viewer.
	 * @param string $guid    GUID.
	 * @param array  $event   action ( progress|watched|unwatched ), epoch, generation, session, seq,
	 *                        position_ms, duration_ms, segments.
	 * @return array|WP_Error The saved row, or a conflict for stale events.
	 */
	public static function apply( $user_id, $guid, array $event ) {
		$store = self::store();
		if ( ! $store ) {
			return new WP_Error( 'videopress_history_unavailable', __( 'Viewing history is not available on this site.', 'jetpack-videopress-pkg' ), array( 'status' => 404 ) );
		}
		$action = (string) ( $event['action'] ?? 'progress' );
		if ( (int) ( $event['epoch'] ?? -1 ) !== self::epoch( $user_id ) ) {
			return self::stale( $user_id, $guid );
		}
		$row = $store->get( $user_id, $guid );
		$row = $row ? $row : self::blank( $user_id, $guid );

		if ( 'progress' === $action ) {
			if ( (int) ( $event['generation'] ?? -1 ) !== $row['generation'] ) {
				return self::stale( $user_id, $guid );
			}
			$session = substr( (string) ( $event['session'] ?? '' ), 0, 40 );
			$seq     = (int) ( $event['seq'] ?? 0 );
			if ( '' !== $session && $session === $row['session'] && $seq <= $row['seq'] ) {
				return $row;
			}
			$duration = max( $row['duration_ms'], (int) ( $event['duration_ms'] ?? 0 ) );
			$segments = array_slice( is_array( $event['segments'] ?? null ) ? $event['segments'] : array(), 0, self::MAX_SEGMENTS );

			$row['deleted']     = false;
			$row['duration_ms'] = $duration;
			$row['intervals']   = self::merge_intervals( array_merge( $row['intervals'], $segments ), $duration );
			$row['watched_ms']  = self::covered( $row['intervals'] );
			$row['position_ms'] = max( 0, min( (int) ( $event['position_ms'] ?? 0 ), $duration > 0 ? $duration : PHP_INT_MAX ) );
			$row['completed']   = $row['completed'] || ( $duration > 0 && $row['watched_ms'] >= self::COMPLETION_RATIO * $duration );
			$row['session']     = $session;
			$row['seq']         = $seq;
			if ( 'unwatched' === $row['manual'] && $row['watched_ms'] > 0 ) {
				// Playing again after a reset starts the history over.
				$row['manual'] = '';
			}
		} elseif ( 'watched' === $action ) {
			$row['deleted'] = false;
			$row['manual']  = 'watched';
		} elseif ( 'unwatched' === $action ) {
			$row = array_merge(
				self::blank( $user_id, $guid ),
				array(
					'manual'     => 'unwatched',
					'generation' => $row['generation'] + 1,
				)
			);
		} else {
			return new WP_Error( 'videopress_history_invalid', __( 'Unknown history action.', 'jetpack-videopress-pkg' ), array( 'status' => 400 ) );
		}

		$row['updated'] = time();
		$store->save( $row );
		return $row;
	}

	/**
	 * Remove one video from a viewer's history, leaving a tombstone that rejects older events.
	 *
	 * @param int    $user_id Viewer.
	 * @param string $guid    GUID.
	 * @return array The tombstone.
	 */
	public static function forget( $user_id, $guid ) {
		$store = self::store();
		$row   = $store ? $store->get( $user_id, $guid ) : null;
		$stone = array_merge(
			self::blank( $user_id, $guid ),
			array(
				'generation' => ( $row ? $row['generation'] : 0 ) + 1,
				'deleted'    => true,
				'updated'    => time(),
			)
		);
		if ( $store ) {
			$store->save( $stone );
		}
		return $stone;
	}

	/**
	 * Clear a viewer's whole history; events issued before stop being accepted.
	 *
	 * @param int $user_id Viewer.
	 * @return int The new epoch.
	 */
	public static function clear( $user_id ) {
		$store = self::store();
		if ( $store ) {
			$store->delete_all( $user_id );
		}
		$epoch = self::epoch( $user_id ) + 1;
		update_user_meta( (int) $user_id, self::EPOCH_META, $epoch );
		return $epoch;
	}

	/**
	 * The conflict returned for an event older than a reset or clear.
	 *
	 * @param int    $user_id Viewer.
	 * @param string $guid    GUID.
	 * @return WP_Error
	 */
	private static function stale( $user_id, $guid ) {
		$store = self::store();
		$row   = $store ? $store->get( $user_id, $guid ) : null;
		return new WP_Error(
			'videopress_history_stale',
			__( 'This viewing session was reset.', 'jetpack-videopress-pkg' ),
			array(
				'status'     => 409,
				'epoch'      => self::epoch( $user_id ),
				'generation' => $row ? $row['generation'] : 0,
			)
		);
	}

	/**
	 * A row as returned to its viewer.
	 *
	 * @param array  $row  Row, or blank.
	 * @param string $guid GUID.
	 * @return array
	 */
	public static function present( $row, $guid ) {
		$row = is_array( $row ) ? $row : self::blank( get_current_user_id(), $guid );
		return array(
			'guid'       => $guid,
			'status'     => self::status( $row ),
			'positionMs' => $row['deleted'] ? 0 : $row['position_ms'],
			'durationMs' => $row['duration_ms'],
			'watchedMs'  => $row['deleted'] ? 0 : $row['watched_ms'],
			'completed'  => ! $row['deleted'] && $row['completed'],
			'manual'     => $row['manual'],
			'legacySeen' => $row['legacy_seen'],
			'generation' => $row['generation'],
			'updated'    => $row['updated'] ? gmdate( 'c', $row['updated'] ) : null,
		);
	}

	/**
	 * Register the viewer routes under Rest_Controller::REST_NAMESPACE.
	 *
	 * @return void
	 */
	public static function register_rest_routes() {
		if ( ! self::is_enabled() ) {
			return;
		}
		register_rest_route(
			Rest_Controller::REST_NAMESPACE,
			'/me/history',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'rest_list' ),
					'permission_callback' => array( __CLASS__, 'rest_is_viewer' ),
					'args'                => array(
						'per_page' => array(
							'type'    => 'integer',
							'minimum' => 1,
							'maximum' => self::MAX_PAGE,
							'default' => 20,
						),
						'cursor'   => array( 'type' => 'string' ),
						'guids'    => array(
							'type'     => 'array',
							'items'    => array(
								'type'    => 'string',
								'pattern' => '^[a-zA-Z0-9]{8}$',
							),
							'maxItems' => 100,
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( __CLASS__, 'rest_clear' ),
					'permission_callback' => array( __CLASS__, 'rest_is_viewer' ),
				),
			)
		);
		register_rest_route(
			Rest_Controller::REST_NAMESPACE,
			'/me/history/(?P<guid>[a-zA-Z0-9]{8})',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'rest_get' ),
					'permission_callback' => array( __CLASS__, 'rest_can_track' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'rest_post' ),
					'permission_callback' => array( __CLASS__, 'rest_can_track' ),
					'args'                => array(
						'action'      => array(
							'type'    => 'string',
							'enum'    => array( 'progress', 'watched', 'unwatched' ),
							'default' => 'progress',
						),
						'epoch'       => array(
							'type'     => 'integer',
							'required' => true,
						),
						'generation'  => array( 'type' => 'integer' ),
						'session'     => array(
							'type'      => 'string',
							'maxLength' => 40,
						),
						'seq'         => array(
							'type'    => 'integer',
							'minimum' => 0,
						),
						'position_ms' => array(
							'type'    => 'integer',
							'minimum' => 0,
						),
						'duration_ms' => array(
							'type'    => 'integer',
							'minimum' => 0,
						),
						'segments'    => array(
							'type'     => 'array',
							'maxItems' => self::MAX_SEGMENTS,
							'items'    => array(
								'type'     => 'array',
								'items'    => array(
									'type'    => 'integer',
									'minimum' => 0,
								),
								'minItems' => 2,
								'maxItems' => 2,
							),
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( __CLASS__, 'rest_forget' ),
					'permission_callback' => array( __CLASS__, 'rest_can_track' ),
				),
			)
		);
	}

	/**
	 * Any signed-in reader, subscribers included, has a history.
	 *
	 * @return bool|WP_Error
	 */
	public static function rest_is_viewer() {
		if ( ! is_user_logged_in() ) {
			return new WP_Error( 'rest_not_logged_in', __( 'Sign in to keep a viewing history.', 'jetpack-videopress-pkg' ), array( 'status' => 401 ) );
		}
		return current_user_can( 'read' );
	}

	/**
	 * A history entry is only for videos of this site the viewer can see.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return bool|WP_Error
	 */
	public static function rest_can_track( WP_REST_Request $request ) {
		$viewer = self::rest_is_viewer();
		if ( true !== $viewer ) {
			return $viewer;
		}
		return self::can_see( (string) $request['guid'] ) ? true : new WP_Error( 'videopress_history_not_found', __( 'Video not found.', 'jetpack-videopress-pkg' ), array( 'status' => 404 ) );
	}

	/**
	 * Whether the current viewer can see a video of this site.
	 *
	 * @param string $guid GUID.
	 * @return bool
	 */
	public static function can_see( $guid ) {
		$id = Channel::attachment_id( $guid );
		return $id > 0 && ( Transcript_Index::is_public_video( $id ) || current_user_can( 'read' ) );
	}

	/**
	 * Private, never cached.
	 *
	 * @param mixed $data Response data.
	 * @return WP_REST_Response
	 */
	private static function private_response( $data ) {
		$response = rest_ensure_response( $data );
		$response->header( 'Cache-Control', 'private, no-store, max-age=0' );
		return $response;
	}

	/**
	 * GET /me/history: recent activity, or the rows for given GUIDs ( page hydration ).
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public static function rest_list( WP_REST_Request $request ) {
		$user  = get_current_user_id();
		$store = self::store();
		if ( is_array( $request['guids'] ) ) {
			$items = array();
			foreach ( $store->get_many( $user, $request['guids'] ) as $guid => $row ) {
				if ( self::can_see( $guid ) ) {
					$items[] = self::present( $row, $guid );
				}
			}
			return self::private_response(
				array(
					'epoch' => self::epoch( $user ),
					'items' => $items,
				)
			);
		}

		$after = null;
		if ( is_string( $request['cursor'] ) && preg_match( '/^(\d+):([a-zA-Z0-9]{8})$/', $request['cursor'], $match ) ) {
			$after = array( (int) $match[1], $match[2] );
		}
		$per_page = (int) $request['per_page'];
		$items    = array();
		$full     = false;
		$more     = true;
		// Rows of videos the viewer can no longer see are skipped, so read on until the page is full.
		while ( ! $full && $more ) {
			$rows = $store->list_recent( $user, $per_page, $after );
			$more = count( $rows ) === $per_page;
			foreach ( $rows as $row ) {
				$after = array( $row['updated'], $row['guid'] );
				if ( self::can_see( $row['guid'] ) ) {
					$items[] = self::present( $row, $row['guid'] ) + array( 'title' => html_entity_decode( get_the_title( Channel::attachment_id( $row['guid'] ) ), ENT_QUOTES, 'UTF-8' ) );
					$full    = count( $items ) === $per_page;
					if ( $full ) {
						break;
					}
				}
			}
		}
		$next = $full && null !== $after ? $after[0] . ':' . $after[1] : null;
		return self::private_response(
			array(
				'epoch'      => self::epoch( $user ),
				'items'      => $items,
				'nextCursor' => $next,
			)
		);
	}

	/**
	 * GET /me/history/{guid}.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public static function rest_get( WP_REST_Request $request ) {
		$user = get_current_user_id();
		$guid = (string) $request['guid'];
		return self::private_response( array( 'epoch' => self::epoch( $user ) ) + self::present( self::store()->get( $user, $guid ), $guid ) );
	}

	/**
	 * POST /me/history/{guid}: progress, or an explicit watched or unwatched.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function rest_post( WP_REST_Request $request ) {
		$user = get_current_user_id();
		$guid = (string) $request['guid'];
		$row  = self::apply(
			$user,
			$guid,
			array(
				'action'      => (string) $request['action'],
				'epoch'       => (int) $request['epoch'],
				'generation'  => $request->has_param( 'generation' ) ? (int) $request['generation'] : -1,
				'session'     => (string) $request['session'],
				'seq'         => (int) $request['seq'],
				'position_ms' => (int) $request['position_ms'],
				'duration_ms' => (int) $request['duration_ms'],
				'segments'    => (array) $request['segments'],
			)
		);
		if ( is_wp_error( $row ) ) {
			return $row;
		}
		return self::private_response( array( 'epoch' => self::epoch( $user ) ) + self::present( $row, $guid ) );
	}

	/**
	 * DELETE /me/history/{guid}.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response
	 */
	public static function rest_forget( WP_REST_Request $request ) {
		$user = get_current_user_id();
		$guid = (string) $request['guid'];
		return self::private_response( array( 'epoch' => self::epoch( $user ) ) + self::present( self::forget( $user, $guid ), $guid ) );
	}

	/**
	 * DELETE /me/history.
	 *
	 * @return WP_REST_Response
	 */
	public static function rest_clear() {
		return self::private_response(
			array(
				'cleared' => true,
				'epoch'   => self::clear( get_current_user_id() ),
			)
		);
	}

	/**
	 * Purge daily.
	 *
	 * @return void
	 */
	public static function schedule_purge() {
		if ( self::is_enabled() && ! wp_next_scheduled( self::PURGE_HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::PURGE_HOOK );
		}
	}

	/**
	 * Delete history a year past its last activity, and old tombstones.
	 *
	 * @return int Rows deleted.
	 */
	public static function purge() {
		$store = self::store();
		return $store ? $store->purge( time() - self::RETENTION, time() - self::TOMBSTONE_TTL ) : 0;
	}

	/**
	 * A deleted account takes its history with it.
	 *
	 * @param int $user_id User.
	 * @return void
	 */
	public static function forget_user( $user_id ) {
		$store = self::store();
		if ( $store ) {
			$store->delete_all( (int) $user_id );
		}
	}

	/**
	 * Register the personal data exporter.
	 *
	 * @param array $exporters Exporters.
	 * @return array
	 */
	public static function register_exporter( $exporters ) {
		$exporters['videopress-viewer-history'] = array(
			'exporter_friendly_name' => __( 'VideoPress viewing history', 'jetpack-videopress-pkg' ),
			'callback'               => array( __CLASS__, 'export_personal_data' ),
		);
		return $exporters;
	}

	/**
	 * Register the personal data eraser.
	 *
	 * @param array $erasers Erasers.
	 * @return array
	 */
	public static function register_eraser( $erasers ) {
		$erasers['videopress-viewer-history'] = array(
			'eraser_friendly_name' => __( 'VideoPress viewing history', 'jetpack-videopress-pkg' ),
			'callback'             => array( __CLASS__, 'erase_personal_data' ),
		);
		return $erasers;
	}

	/**
	 * Export a user's history.
	 *
	 * @param string $email Email address.
	 * @return array
	 */
	public static function export_personal_data( $email ) {
		$user  = get_user_by( 'email', $email );
		$store = self::store();
		$data  = array();
		if ( $user && $store ) {
			foreach ( $store->list_recent( $user->ID, 1000 ) as $row ) {
				$data[] = array(
					'group_id'    => 'videopress-viewer-history',
					'group_label' => __( 'VideoPress viewing history', 'jetpack-videopress-pkg' ),
					'item_id'     => 'videopress-history-' . $row['guid'],
					'data'        => array(
						array(
							'name'  => __( 'Video', 'jetpack-videopress-pkg' ),
							'value' => $row['guid'],
						),
						array(
							'name'  => __( 'Status', 'jetpack-videopress-pkg' ),
							'value' => self::status( $row ),
						),
						array(
							'name'  => __( 'Last activity', 'jetpack-videopress-pkg' ),
							'value' => gmdate( 'c', $row['updated'] ),
						),
					),
				);
			}
		}
		return array(
			'data' => $data,
			'done' => true,
		);
	}

	/**
	 * Erase a user's history.
	 *
	 * @param string $email Email address.
	 * @return array
	 */
	public static function erase_personal_data( $email ) {
		$user = get_user_by( 'email', $email );
		if ( $user ) {
			self::clear( $user->ID );
		}
		return array(
			'items_removed'  => (bool) $user,
			'items_retained' => false,
			'messages'       => array(),
			'done'           => true,
		);
	}

	/**
	 * GUIDs a viewer has watched ( automatically or by marking them ), most recent first, bounded.
	 *
	 * @param int $user_id Viewer.
	 * @return string[]
	 */
	public static function watched_guids( $user_id ) {
		$store = self::store();
		if ( ! $store || ! $user_id ) {
			return array();
		}
		$guids = array();
		foreach ( $store->list_recent( (int) $user_id, self::HIDE_LIMIT ) as $row ) {
			if ( self::STATUS_WATCHED === self::status( $row ) ) {
				$guids[] = $row['guid'];
			}
		}
		return $guids;
	}

	/**
	 * Whether the current request asks to hide the viewer's watched videos.
	 *
	 * @return bool
	 */
	public static function hide_watched_requested() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only listing argument.
		return is_user_logged_in() && self::is_enabled() && isset( $_GET[ self::QUERY_ARG_HIDE ] ) && 'watched' === $_GET[ self::QUERY_ARG_HIDE ];
	}

	/**
	 * `?videopress_unwatched=1`: open a random video the viewer has not watched. Random offsets into
	 * the channel's newest-first order, a bounded number of tries, then a bounded scan; never
	 * ORDER BY RAND over the archive.
	 *
	 * @return void
	 */
	public static function maybe_pick_unwatched() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only navigation.
		if ( empty( $_GET[ self::QUERY_ARG_PICK ] ) || ! Channel::is_enabled() ) {
			return;
		}
		nocache_headers();
		$watched = array_flip( self::is_enabled() ? self::watched_guids( get_current_user_id() ) : array() );
		$total   = Channel_Data::video_count();
		$state   = array(
			'search' => '',
			'sort'   => 'newest',
			'length' => 'any',
			'terms'  => array(),
		);
		$pick    = null;
		for ( $try = 0; $try < self::PICK_ATTEMPTS && $total > 0 && null === $pick; $try++ ) {
			$entry = Channel_Data::browse( $state + array( 'page' => wp_rand( 1, $total ) ), 1 )['entries'][0] ?? null;
			if ( $entry && ! isset( $watched[ $entry['guid'] ] ) ) {
				$pick = $entry;
			}
		}
		if ( null === $pick && $total > 0 ) {
			foreach ( Channel_Data::browse( $state + array( 'page' => 1 ), self::PICK_SCAN )['entries'] as $entry ) {
				if ( ! isset( $watched[ $entry['guid'] ] ) ) {
					$pick = $entry;
					break;
				}
			}
		}
		$url = $pick ? Channel::video_url( (int) $pick['id'] ) : Channel_Data::videos_page_url();
		wp_safe_redirect( '' !== $url ? $url : home_url( '/' ) );
		exit;
	}

	/**
	 * Load the personal discovery script on channel pages for signed-in viewers: watched badges,
	 * progress bars, Continue watching shelves and the watched toggle. Pages stay shared and
	 * cacheable; the script fills them in after load.
	 *
	 * @return void
	 */
	public static function enqueue_discovery_script() {
		if ( ! is_user_logged_in() || ! self::is_enabled() ) {
			return;
		}
		$asset_file = __DIR__ . '/../build/lib/viewer-discovery.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}
		$asset = require $asset_file;
		wp_enqueue_script( 'videopress-viewer-discovery', plugins_url( '../build/lib/viewer-discovery.js', __FILE__ ), $asset['dependencies'], $asset['version'], true );
		wp_set_script_translations( 'videopress-viewer-discovery', 'jetpack-videopress-pkg' );
		$guid = Channel::is_video_page() ? Channel::queried_guid() : '';
		wp_add_inline_script(
			'videopress-viewer-discovery',
			'window.videoPressViewerDiscovery = ' . wp_json_encode(
				array(
					'root'     => rest_url( Rest_Controller::REST_NAMESPACE . '/me/history' ),
					'nonce'    => wp_create_nonce( 'wp_rest' ),
					'videoUrl' => add_query_arg( 'v', '__GUID__', home_url( '/' . Channel::ENDPOINT ) ),
					'startVar' => Channel::START_VAR,
					'guid'     => $guid,
					'epoch'    => self::epoch( get_current_user_id() ),
					'pickUrl'  => add_query_arg( self::QUERY_ARG_PICK, '1', home_url( '/' ) ),
				),
				JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES
			) . ';',
			'before'
		);
	}

	/**
	 * Load the history collector on a channel video page, for signed-in viewers.
	 *
	 * @return void
	 */
	public static function enqueue_viewer_script() {
		if ( ! is_user_logged_in() || ! Channel::is_video_page() || ! self::is_enabled() ) {
			return;
		}
		$guid = Channel::queried_guid();
		if ( '' === $guid || ! self::can_see( $guid ) ) {
			return;
		}
		$asset_file = __DIR__ . '/../build/lib/viewer-history.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}
		$asset = require $asset_file;
		wp_enqueue_script( 'videopress-viewer-history', plugins_url( '../build/lib/viewer-history.js', __FILE__ ), $asset['dependencies'], $asset['version'], true );
		$user = get_current_user_id();
		$row  = self::store()->get( $user, $guid );
		wp_add_inline_script(
			'videopress-viewer-history',
			'window.videoPressViewerHistory = ' . wp_json_encode(
				array(
					'guid'       => $guid,
					'path'       => rest_url( Rest_Controller::REST_NAMESPACE . '/me/history/' . $guid ),
					'nonce'      => wp_create_nonce( 'wp_rest' ),
					'epoch'      => self::epoch( $user ),
					'generation' => $row ? $row['generation'] : 0,
					'state'      => self::present( $row, $guid ),
				),
				JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES
			) . ';',
			'before'
		);
	}
}
