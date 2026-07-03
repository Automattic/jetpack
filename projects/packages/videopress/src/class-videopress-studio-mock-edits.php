<?php
/**
 * VideoPress Studio mock edits REST endpoints.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Error;
use WP_REST_Response;
use WP_REST_Server;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * DEVELOPMENT-ONLY mock for the Studio edits pipeline. The real backend is
 * WPCOM_REST_API_V2_Endpoint_VideoPress_Edits, a thin proxy to the WPCOM v1.1
 * `videos/%s/edits` and `videos/%s/storyboard` endpoints, which serves these
 * exact routes by default. Opt into the mock with the
 * `videopress_studio_mock_edits` filter (default false) to develop the Studio
 * editor against local, deterministic state instead of a connected WPCOM
 * backend — the routes are identical either way, so the frontend never knows.
 *
 * Mocked contract (all timestamps are integer milliseconds on the ORIGINAL
 * master timeline; editing is non-destructive — the server keeps the master):
 *
 * - GET /wpcom/v2/videopress/{guid}/edits → 200
 *   { guid, revision:int, original_duration_ms:int, output_duration_ms:int,
 *     operations:[ { type:'trim'|'cut', start_ms:int, end_ms:int } ],
 *     can_restore_original:bool,
 *     job:{ id:string|null, status:'idle'|'processing'|'complete'|'failed',
 *           target_revision:int|null, progress:float|null,
 *           error:{ code, message }|null },
 *     updated:string(ISO8601) }
 * - POST same path, body { base_revision:int, operations:[...] } → 202
 *   { guid, revision, job }. Errors: 409 `edits_conflict` (base_revision
 *   mismatch), 409 `edits_job_in_progress`, 400 `edits_invalid_operations`
 *   (values must be ints with 0 <= start < end <= original_duration_ms; at
 *   most one trim; cuts non-overlapping after sorting and contained in the
 *   trim window), 422 `edits_output_too_short` (output < 1000ms).
 * - DELETE same path (restore original) → 202 { guid, revision, job }.
 *   Semantically a POST with empty operations; still bumps the revision.
 * - GET /wpcom/v2/videopress/{guid}/storyboard → always 404
 *   `storyboard_unavailable` in this mock. The real endpoint is future WPCOM
 *   work and will return:
 *   { url, tile_width, tile_height, tiles, columns, interval_ms }
 *
 * Mock mechanics:
 *
 * - State lives in one site option PER GUID (see OPTION_NAME, the prefix):
 *   { revision, operations, job:{ status, target_revision,
 *     pending_operations, started_at, fail }, updated }. One option per
 *   video keeps concurrent requests for different videos from clobbering
 *   each other's read-modify-write cycles on a shared map.
 * - Jobs are promoted lazily (no cron): on any request, a processing job
 *   whose `started_at` is at least `videopress_studio_mock_edits_delay`
 *   (default 10s) old completes — revision becomes target_revision and the
 *   pending operations are committed. While processing, progress is
 *   min( elapsed / delay, 0.99 ).
 * - Deterministic failure path for UI testing: any cut with
 *   start_ms === 13000 makes the job fail with `transcode_failed` instead of
 *   completing; revision and operations stay untouched.
 *
 * @phan-constructor-used-for-side-effects
 */
class VideoPress_Studio_Mock_Edits {

	/**
	 * Prefix of the per-GUID site options holding the mock edit state; the
	 * record for a video lives in "{OPTION_NAME}_{guid}".
	 */
	const OPTION_NAME = 'videopress_studio_mock_edits';

	/**
	 * Minimum output duration (trim window minus cuts) accepted by a save,
	 * mirroring MIN_OUTPUT_MS in the frontend edit-session state core.
	 */
	const MIN_OUTPUT_MS = 1000;

	/**
	 * A cut starting exactly at this timestamp makes the mock job fail with
	 * `transcode_failed`, giving the UI a deterministic failure to exercise.
	 */
	const FAILING_CUT_START_MS = 13000;

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Whether the mock endpoints should register at all.
	 *
	 * Mirrors the guard in Initializer so the class is self-contained and the
	 * gating is testable without driving the whole initializer.
	 *
	 * @return bool
	 */
	public static function should_register() {
		/**
		 * Filters whether the local Studio mock edits endpoints replace the
		 * WPCOM proxy. Off by default: the mock is a development tool. Turn
		 * it on to work on the Studio editor against local, deterministic
		 * state instead of a connected WPCOM backend. The mock only ever
		 * registers when the Studio feature filter is also on.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $use_mock Defaults to false.
		 */
		return Admin_UI::is_studio_enabled() && apply_filters( 'videopress_studio_mock_edits', false );
	}

	/**
	 * Register the edits and storyboard routes.
	 */
	public function register_routes() {
		if ( ! self::should_register() ) {
			return;
		}

		$guid_arg = array(
			'guid' => array(
				'description' => __( 'The VideoPress GUID.', 'jetpack-videopress-pkg' ), // @phan-suppress-current-line PhanPluginMixedKeyNoKey
				'type'        => 'string',
				'required'    => true,
			),
		);

		register_rest_route(
			'wpcom/v2',
			'videopress/(?P<guid>\w+)/edits',
			array(
				'args' => $guid_arg,
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_edits' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'args'                => array(
						'base_revision' => array(
							'description' => __( 'The revision the client based its edits on.', 'jetpack-videopress-pkg' ),
							'type'        => 'integer',
							'required'    => true,
						),
					),
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'save_edits' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( $this, 'restore_original' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
			)
		);

		register_rest_route(
			'wpcom/v2',
			'videopress/(?P<guid>\w+)/storyboard',
			array(
				'args' => $guid_arg,
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_storyboard' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
			)
		);
	}

	/**
	 * Permission check shared by every route.
	 *
	 * @return bool
	 */
	public function permissions_check() {
		return Data::can_perform_action() && current_user_can( 'upload_files' );
	}

	/**
	 * GET /wpcom/v2/videopress/{guid}/edits — current edit state.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_edits( $request ) {
		$guid  = $request['guid'];
		$video = $this->resolve_video( $guid );
		if ( is_wp_error( $video ) ) {
			return $video;
		}

		$record = $this->maybe_promote_job( $guid, $this->get_record( $guid ) );

		return rest_ensure_response( $this->edits_payload( $guid, $record, $video ) );
	}

	/**
	 * POST /wpcom/v2/videopress/{guid}/edits — save an operations list.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function save_edits( $request ) {
		$guid  = $request['guid'];
		$video = $this->resolve_video( $guid );
		if ( is_wp_error( $video ) ) {
			return $video;
		}

		$record = $this->maybe_promote_job( $guid, $this->get_record( $guid ) );

		if ( 'processing' === $record['job']['status'] ) {
			return new WP_Error(
				'edits_job_in_progress',
				__( 'An edit job for this video is already processing.', 'jetpack-videopress-pkg' ),
				array( 'status' => 409 )
			);
		}

		$base_revision = (int) $request['base_revision'];
		if ( $base_revision !== (int) $record['revision'] ) {
			return new WP_Error(
				'edits_conflict',
				__( 'The video was edited by someone else. Reload the latest revision before saving.', 'jetpack-videopress-pkg' ),
				array(
					'status'           => 409,
					'current_revision' => (int) $record['revision'],
				)
			);
		}

		$operations = $this->validate_operations( $request->get_param( 'operations' ), $video['duration_ms'] );
		if ( is_wp_error( $operations ) ) {
			return $operations;
		}

		if ( $this->output_duration_ms( $operations, $video['duration_ms'] ) < self::MIN_OUTPUT_MS ) {
			return new WP_Error(
				'edits_output_too_short',
				/* translators: %d: minimum output duration in milliseconds. */
				sprintf( __( 'The edited video would be shorter than %dms.', 'jetpack-videopress-pkg' ), self::MIN_OUTPUT_MS ),
				array( 'status' => 422 )
			);
		}

		return $this->enqueue_job( $guid, $record, $operations );
	}

	/**
	 * DELETE /wpcom/v2/videopress/{guid}/edits — restore the original master.
	 *
	 * Semantically a POST with an empty operations list (no base_revision
	 * needed: restoring is valid from any baseline); still bumps the revision.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function restore_original( $request ) {
		$guid  = $request['guid'];
		$video = $this->resolve_video( $guid );
		if ( is_wp_error( $video ) ) {
			return $video;
		}

		$record = $this->maybe_promote_job( $guid, $this->get_record( $guid ) );

		if ( 'processing' === $record['job']['status'] ) {
			return new WP_Error(
				'edits_job_in_progress',
				__( 'An edit job for this video is already processing.', 'jetpack-videopress-pkg' ),
				array( 'status' => 409 )
			);
		}

		return $this->enqueue_job( $guid, $record, array() );
	}

	/**
	 * GET /wpcom/v2/videopress/{guid}/storyboard — always unavailable here.
	 *
	 * The real endpoint is future WPCOM work; see the class docblock for the
	 * response shape it will return.
	 *
	 * @param \WP_REST_Request $request The request object.
	 * @return WP_Error
	 */
	public function get_storyboard( $request ) {
		// Lazy promotion runs on any request, including this one.
		$guid = $request['guid'];
		$this->maybe_promote_job( $guid, $this->get_record( $guid ) );

		return new WP_Error(
			'storyboard_unavailable',
			__( 'No storyboard is available for this video.', 'jetpack-videopress-pkg' ),
			array( 'status' => 404 )
		);
	}

	/**
	 * Resolve a GUID to its attachment and original master duration.
	 *
	 * Uses the same guid → attachment lookup the rest of the package uses;
	 * the duration comes from the attachment meta the REST media endpoint
	 * exposes as `media_details.videopress.duration` (already milliseconds).
	 *
	 * @param string $guid The VideoPress GUID.
	 * @return array|WP_Error { attachment_id:int, duration_ms:int }, or a 404 error.
	 */
	private function resolve_video( $guid ) {
		if ( ! function_exists( 'videopress_get_post_id_by_guid' ) ) {
			require_once __DIR__ . '/utility-functions.php';
		}

		$attachment_id = videopress_get_post_id_by_guid( $guid );
		$duration_ms   = 0;
		if ( is_int( $attachment_id ) ) {
			$meta        = wp_get_attachment_metadata( $attachment_id );
			$duration_ms = isset( $meta['videopress']['duration'] ) ? (int) $meta['videopress']['duration'] : 0;
		}

		if ( ! is_int( $attachment_id ) || $duration_ms <= 0 ) {
			return new WP_Error(
				'edits_video_not_found',
				__( 'No editable VideoPress video was found for that GUID.', 'jetpack-videopress-pkg' ),
				array( 'status' => 404 )
			);
		}

		return array(
			'attachment_id' => $attachment_id,
			'duration_ms'   => $duration_ms,
		);
	}

	/**
	 * Name of the option holding one guid's record.
	 *
	 * @param string $guid The VideoPress GUID.
	 * @return string The option name.
	 */
	private function option_name( $guid ) {
		return self::OPTION_NAME . '_' . $guid;
	}

	/**
	 * Read the stored record for a guid, or a pristine default.
	 *
	 * @param string $guid The VideoPress GUID.
	 * @return array The record.
	 */
	private function get_record( $guid ) {
		$record = get_option( $this->option_name( $guid ), null );
		if ( is_array( $record ) ) {
			return $record;
		}

		return array(
			'revision'   => 0,
			'operations' => array(),
			'job'        => array(
				'status'             => 'idle',
				'target_revision'    => null,
				'pending_operations' => null,
				'started_at'         => null,
				'fail'               => false,
			),
			'updated'    => null,
		);
	}

	/**
	 * Persist the record for a guid.
	 *
	 * @param string $guid   The VideoPress GUID.
	 * @param array  $record The record to store.
	 */
	private function save_record( $guid, $record ) {
		update_option( $this->option_name( $guid ), $record, false );
	}

	/**
	 * The simulated transcode delay in seconds.
	 *
	 * @return int
	 */
	private function job_delay() {
		/**
		 * Filters how long (in seconds) a mock edit job stays processing
		 * before it is lazily promoted to complete/failed.
		 *
		 * @since $$next-version$$
		 *
		 * @param int $delay Defaults to 10.
		 */
		return (int) apply_filters( 'videopress_studio_mock_edits_delay', 10 );
	}

	/**
	 * Lazily promote a processing job whose delay has elapsed (no cron).
	 *
	 * Completion commits the pending operations and revision; the
	 * deterministic failure path flips the status to failed and leaves the
	 * committed state untouched.
	 *
	 * @param string $guid   The VideoPress GUID.
	 * @param array  $record The current record.
	 * @return array The (possibly promoted and saved) record.
	 */
	private function maybe_promote_job( $guid, $record ) {
		if ( 'processing' !== $record['job']['status'] ) {
			return $record;
		}
		if ( time() - (int) $record['job']['started_at'] < $this->job_delay() ) {
			return $record;
		}

		if ( ! empty( $record['job']['fail'] ) ) {
			$record['job']['status'] = 'failed';
		} else {
			$record['revision']                  = (int) $record['job']['target_revision'];
			$record['operations']                = array_values( (array) $record['job']['pending_operations'] );
			$record['job']['status']             = 'complete';
			$record['job']['pending_operations'] = null;
		}
		$record['updated'] = time();

		$this->save_record( $guid, $record );

		return $record;
	}

	/**
	 * Store a new processing job and return the 202 response.
	 *
	 * @param string $guid       The VideoPress GUID.
	 * @param array  $record     The current record (job must not be processing).
	 * @param array  $operations Canonical operations the job will commit.
	 * @return WP_REST_Response
	 */
	private function enqueue_job( $guid, $record, $operations ) {
		$fail = false;
		foreach ( $operations as $operation ) {
			if ( 'cut' === $operation['type'] && self::FAILING_CUT_START_MS === $operation['start_ms'] ) {
				$fail = true;
				break;
			}
		}

		$record['job']     = array(
			'status'             => 'processing',
			'target_revision'    => (int) $record['revision'] + 1,
			'pending_operations' => $operations,
			'started_at'         => time(),
			'fail'               => $fail,
		);
		$record['updated'] = time();

		$this->save_record( $guid, $record );

		return new WP_REST_Response(
			array(
				'guid'     => $guid,
				'revision' => (int) $record['revision'],
				'job'      => $this->job_payload( $record['job'] ),
			),
			202
		);
	}

	/**
	 * Build the full GET response body.
	 *
	 * @param string $guid   The VideoPress GUID.
	 * @param array  $record The stored record.
	 * @param array  $video  Resolved video ( attachment_id, duration_ms ).
	 * @return array
	 */
	private function edits_payload( $guid, $record, $video ) {
		$operations = array_values( (array) $record['operations'] );

		if ( ! empty( $record['updated'] ) ) {
			$updated = (int) $record['updated'];
		} else {
			// Never edited: fall back to the attachment's modified time.
			$updated = (int) strtotime( get_post_field( 'post_modified_gmt', $video['attachment_id'] ) . ' UTC' );
		}

		return array(
			'guid'                 => $guid,
			'revision'             => (int) $record['revision'],
			'original_duration_ms' => $video['duration_ms'],
			'output_duration_ms'   => $this->output_duration_ms( $operations, $video['duration_ms'] ),
			'operations'           => $operations,
			'can_restore_original' => ! empty( $operations ),
			'job'                  => $this->job_payload( $record['job'] ),
			'updated'              => gmdate( 'c', $updated ),
		);
	}

	/**
	 * Build the job object shared by every response.
	 *
	 * @param array $job The stored job state.
	 * @return array
	 */
	private function job_payload( $job ) {
		if ( 'idle' === $job['status'] ) {
			return array(
				'id'              => null,
				'status'          => 'idle',
				'target_revision' => null,
				'progress'        => null,
				'error'           => null,
			);
		}

		$progress = null;
		if ( 'processing' === $job['status'] ) {
			$delay    = max( 1, $this->job_delay() );
			$progress = min( (float) ( time() - (int) $job['started_at'] ) / $delay, 0.99 );
		}

		$error = null;
		if ( 'failed' === $job['status'] ) {
			$error = array(
				'code'    => 'transcode_failed',
				'message' => __( 'The edited video could not be transcoded.', 'jetpack-videopress-pkg' ),
			);
		}

		return array(
			'id'              => sprintf( 'mock-job-%d-%d', (int) $job['target_revision'], (int) $job['started_at'] ),
			'status'          => $job['status'],
			'target_revision' => (int) $job['target_revision'],
			'progress'        => $progress,
			'error'           => $error,
		);
	}

	/**
	 * Validate and canonicalize an operations list.
	 *
	 * Rules (mirroring the frontend state core): every value an integer with
	 * 0 <= start < end <= original duration; at most one trim; cuts contained
	 * in the trim window (the full master when no trim) and non-overlapping
	 * after sorting — touching cuts are allowed, overlap is not.
	 *
	 * @param mixed $operations           Raw `operations` request param.
	 * @param int   $original_duration_ms Master duration in ms.
	 * @return array|WP_Error Canonical list (trim first, cuts sorted by start), or a 400 error.
	 */
	private function validate_operations( $operations, $original_duration_ms ) {
		$invalid = static function ( $reason ) {
			return new WP_Error(
				'edits_invalid_operations',
				__( 'The edit operations list is invalid.', 'jetpack-videopress-pkg' ),
				array(
					'status' => 400,
					'reason' => $reason,
				)
			);
		};

		if ( ! is_array( $operations ) ) {
			return $invalid( 'operations must be an array' );
		}

		$trim = null;
		$cuts = array();
		foreach ( array_values( $operations ) as $operation ) {
			if ( ! is_array( $operation ) || ! isset( $operation['type'] ) || ! isset( $operation['start_ms'] ) || ! isset( $operation['end_ms'] ) ) {
				return $invalid( 'each operation needs type, start_ms and end_ms' );
			}
			if ( ! is_int( $operation['start_ms'] ) || ! is_int( $operation['end_ms'] ) ) {
				return $invalid( 'start_ms and end_ms must be integers' );
			}

			$start = $operation['start_ms'];
			$end   = $operation['end_ms'];
			if ( $start < 0 || $start >= $end || $end > $original_duration_ms ) {
				return $invalid( 'operations need 0 <= start_ms < end_ms <= original_duration_ms' );
			}

			if ( 'trim' === $operation['type'] ) {
				if ( null !== $trim ) {
					return $invalid( 'at most one trim operation is allowed' );
				}
				$trim = array(
					'type'     => 'trim',
					'start_ms' => $start,
					'end_ms'   => $end,
				);
			} elseif ( 'cut' === $operation['type'] ) {
				$cuts[] = array(
					'type'     => 'cut',
					'start_ms' => $start,
					'end_ms'   => $end,
				);
			} else {
				return $invalid( 'operation type must be trim or cut' );
			}
		}

		$window_start = $trim ? $trim['start_ms'] : 0;
		$window_end   = $trim ? $trim['end_ms'] : $original_duration_ms;

		usort(
			$cuts,
			static function ( $a, $b ) {
				return $a['start_ms'] <=> $b['start_ms'];
			}
		);

		$previous_end = null;
		foreach ( $cuts as $cut ) {
			if ( $cut['start_ms'] < $window_start || $cut['end_ms'] > $window_end ) {
				return $invalid( 'cuts must sit inside the trim window' );
			}
			if ( null !== $previous_end && $cut['start_ms'] < $previous_end ) {
				return $invalid( 'cuts must not overlap' );
			}
			$previous_end = $cut['end_ms'];
		}

		return $trim ? array_merge( array( $trim ), $cuts ) : $cuts;
	}

	/**
	 * Output duration of a canonical operations list: the trim window minus
	 * the total cut time.
	 *
	 * @param array $operations           Canonical operations (validated).
	 * @param int   $original_duration_ms Master duration in ms.
	 * @return int
	 */
	private function output_duration_ms( $operations, $original_duration_ms ) {
		$start   = 0;
		$end     = $original_duration_ms;
		$removed = 0;
		foreach ( $operations as $operation ) {
			if ( 'trim' === $operation['type'] ) {
				$start = (int) $operation['start_ms'];
				$end   = (int) $operation['end_ms'];
			} elseif ( 'cut' === $operation['type'] ) {
				$removed += (int) $operation['end_ms'] - (int) $operation['start_ms'];
			}
		}

		return $end - $start - $removed;
	}
}
