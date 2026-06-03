<?php
/**
 * Jetpack Backup Abilities Registration.
 *
 * Registers Jetpack Backup abilities with the WordPress Abilities API so AI
 * agents can read backup status and trigger on-demand backups through the
 * standard `wp-abilities/v1` REST surface.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005\Abilities;

use Automattic\Jetpack\Backup\V0005\Jetpack_Backup;
use Automattic\Jetpack\My_Jetpack\Products\Backup as My_Jetpack_Backup;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_Error;
use WP_REST_Response;

/**
 * Registers Jetpack Backup abilities with the WordPress Abilities API.
 *
 * Exposes a small, agent-friendly surface for site backups:
 *
 * - `jetpack-backup/get-backup-overview` — single-call site backup health snapshot.
 * - `jetpack-backup/list-backups` — recent backups with optional id/pagination filters.
 * - `jetpack-backup/list-restores` — recent restores with optional id/pagination filters.
 * - `jetpack-backup/request-backup` — enqueue an on-demand backup.
 */
class Backup_Abilities extends Registrar {

	const PER_PAGE_DEFAULT = 20;
	const PER_PAGE_MAX     = 100;

	/**
	 * Return the ability category slug.
	 *
	 * @return string
	 */
	public static function get_category_slug(): string {
		return 'site';
	}

	/**
	 * Required by the abstract parent, but unused: the `site` category is
	 * already registered upstream (WordPress core / wpcom), so we don't
	 * re-declare it. Kept so the contract holds if a consumer ever asks for
	 * the definition we *would* use.
	 *
	 * @return array
	 */
	public static function get_category_definition(): array {
		return array(
			'label'       => __( 'Site', 'jetpack-backup-pkg' ),
			'description' => __( 'Site-wide management abilities (registered upstream).', 'jetpack-backup-pkg' ),
		);
	}

	/**
	 * Override the Registrar lifecycle so the backup abilities only register
	 * on sites that actually have a Jetpack Backup product provisioned.
	 * Mirrors the gating done in the Jetpack dashboard / My Jetpack — there's
	 * no point exposing tool surfaces an agent can never use, and on free
	 * sites the upstream wpcom endpoints either silently accept writes (e.g.
	 * `request-backup` reported `enqueued: true`) or return null payloads
	 * that confuse callers.
	 *
	 * The `site` category is registered upstream by WordPress core / wpcom,
	 * so this class never tries to register a category — `register_category`
	 * is a no-op even though the parent hooks it.
	 *
	 * @return void
	 */
	public static function register_category() {
		// No-op: `site` is registered upstream; re-registering would either
		// no-op or trigger "already registered" notices.
	}

	/**
	 * Register every ability returned by `get_abilities()`, gated on the
	 * Backup product being loaded. See `register_category()` for why we
	 * never register a category from here.
	 *
	 * @return void
	 */
	public static function register_abilities() {
		if ( ! self::backup_is_loaded() ) {
			return;
		}
		parent::register_abilities();
	}

	/**
	 * Is the Jetpack Backup product actually loaded on this site?
	 *
	 * Defaults to `My_Jetpack\Products\Backup::is_active()` — the same
	 * boolean the Jetpack dashboard uses to decide whether the Backup
	 * product is usable. That returns true when the plugin is active and
	 * the site has a Backup plan (covering `STATUS_ACTIVE`,
	 * `STATUS_EXPIRING_SOON`, and the `STATUS_NEEDS_ATTENTION__*` states),
	 * and false for `STATUS_EXPIRED`, `STATUS_NEEDS_PLAN`,
	 * `STATUS_MODULE_DISABLED`, and the connection-error states. The plan
	 * lookup is cached for 15s in `MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY`,
	 * so the cost on a real wpcom call is paid at most once per 15 seconds
	 * across the whole My Jetpack surface.
	 *
	 * The `jetpack_backup_abilities_should_load` filter lets consumers and
	 * tests override the answer without round-tripping through the My
	 * Jetpack product class.
	 *
	 * @return bool
	 */
	private static function backup_is_loaded(): bool {
		$default = class_exists( My_Jetpack_Backup::class ) && My_Jetpack_Backup::is_active();

		/**
		 * Filters whether the Jetpack Backup abilities should register on
		 * this site. Defaults to `My_Jetpack\Products\Backup::is_active()`.
		 *
		 * @since 0.1.0
		 *
		 * @param bool $should_load Whether to register the backup abilities.
		 */
		return (bool) apply_filters( 'jetpack_backup_abilities_should_load', $default );
	}

	/**
	 * Return the abilities this Registrar exposes, keyed by slug.
	 *
	 * @return array<string, array<string, mixed>>
	 */
	public static function get_abilities(): array {
		// `id` is the rewind_id (a timestamp-fractional string like
		// "1752860369.781") — the single cross-system identifier exposed by
		// the wpcom rewind, restore, and activity-log APIs. Use it whenever
		// referring to a specific backup across abilities.
		//
		// For in-progress backup attempts the rewind_id isn't assigned yet,
		// in which case `id` is null. Such backups can't be looked up by id
		// anywhere — wait for completion and re-query.
		$backup_item_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'            => array( 'type' => array( 'string', 'null' ) ),
				'started'       => array( 'type' => array( 'string', 'null' ) ),
				'last_updated'  => array( 'type' => array( 'string', 'null' ) ),
				'status'        => array( 'type' => array( 'string', 'null' ) ),
				'period'        => array( 'type' => array( 'string', 'integer', 'null' ) ),
				'is_rewindable' => array( 'type' => array( 'boolean', 'null' ) ),
				'has_warnings'  => array( 'type' => array( 'boolean', 'null' ) ),
			),
		);

		// Same convention applies to restores: `id` is the rewind_id of the
		// backup being restored to.
		$restore_item_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'           => array( 'type' => array( 'string', 'null' ) ),
				'started'      => array( 'type' => array( 'string', 'null' ) ),
				'last_updated' => array( 'type' => array( 'string', 'null' ) ),
				'status'       => array( 'type' => array( 'string', 'null' ) ),
				'progress'     => array( 'type' => array( 'integer', 'null' ) ),
			),
		);

		return array(
			'jetpack-backup/get-backup-overview' => array(
				'label'               => __( 'Get backup overview', 'jetpack-backup-pkg' ),
				'description'         => __(
					'Return a single-call snapshot of the site backup state: { last_backup, recent_backup_count, schedule, storage }. Use this to answer "is my site protected?" before deciding whether to call list-backups, list-restores, or request-backup. Read-only and idempotent. Fields whose backing service is unreachable come back as null rather than failing the call. Requires the manage_options capability.',
					'jetpack-backup-pkg'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'recent_backup_count' => array( 'type' => array( 'integer', 'null' ) ),
						'last_backup'         => array(
							'type'       => array( 'object', 'null' ),
							'properties' => array(
								'id'            => array( 'type' => array( 'string', 'null' ) ),
								'last_updated'  => array( 'type' => array( 'string', 'null' ) ),
								'status'        => array( 'type' => array( 'string', 'null' ) ),
								'is_rewindable' => array( 'type' => array( 'boolean', 'null' ) ),
								'has_warnings'  => array( 'type' => array( 'boolean', 'null' ) ),
							),
						),
						'schedule'            => array(
							'type'       => array( 'object', 'null' ),
							'properties' => array(
								'hour'   => array( 'type' => array( 'integer', 'null' ) ),
								'minute' => array( 'type' => array( 'integer', 'null' ) ),
							),
						),
						'storage'             => array(
							'type'       => array( 'object', 'null' ),
							'properties' => array(
								'used_bytes'  => array( 'type' => array( 'integer', 'null' ) ),
								'limit_bytes' => array( 'type' => array( 'integer', 'null' ) ),
							),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_get_backup_overview' ),
				'permission_callback' => array( __CLASS__, 'can_view_backups' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool',
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-backup/list-backups'        => array(
				'label'               => __( 'List backups', 'jetpack-backup-pkg' ),
				'description'         => __(
					'Return zero or more backups as an array. Each item summarises one backup: { id, rewind_id, started, last_updated, status, period, is_rewindable, has_warnings }. Combine filters to narrow the result without making multiple calls. `id` returns a 0- or 1-element array for a single rewind_id. `date_from` and `date_to` window the results (ISO 8601 datetimes; server-side filter). `date` + `match` ("on_or_before" default, "on_or_after", "closest") pick a single backup near a target datetime — useful for "find a restore point near this incident"; the response stays a 0- or 1-element array. `status` filters by mapped status (e.g. "finished", "error"). `page` + `per_page` paginate the result; iterate `page=1,2,...` until you get an empty array. A page may come back with fewer than `per_page` items even when more pages exist — `status` is applied client-side, and non-backup events are filtered out — so only an empty page reliably signals end of history. Read-only and idempotent. Backed by the wpcom activity-log feed.',
					'jetpack-backup-pkg'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(
						'id'        => array(
							'type'        => 'string',
							'description' => __( 'Return only the backup with this rewind_id. Unknown ids yield an empty array.', 'jetpack-backup-pkg' ),
							'minLength'   => 1,
						),
						'date_from' => array(
							'type'        => 'string',
							'format'      => 'date-time',
							'description' => __( 'Lower bound (inclusive) on backup `started` time. ISO 8601 datetime, e.g. "2026-04-01T00:00:00Z".', 'jetpack-backup-pkg' ),
							'minLength'   => 1,
						),
						'date_to'   => array(
							'type'        => 'string',
							'format'      => 'date-time',
							'description' => __( 'Upper bound (inclusive) on backup `started` time. ISO 8601 datetime, e.g. "2026-04-30T23:59:59Z".', 'jetpack-backup-pkg' ),
							'minLength'   => 1,
						),
						'date'      => array(
							'type'        => 'string',
							'format'      => 'date-time',
							'description' => __( 'Target datetime to find a single matching backup. When set, the response is a 0- or 1-element array. Pair with `match` to choose direction.', 'jetpack-backup-pkg' ),
							'minLength'   => 1,
						),
						'match'     => array(
							'type'        => 'string',
							'enum'        => array( 'on_or_before', 'on_or_after', 'closest' ),
							'default'     => 'on_or_before',
							'description' => __( 'How to interpret `date`. "on_or_before" (default; the latest backup at or before the target — typical for restores), "on_or_after" (earliest backup at or after), or "closest" (smallest absolute time difference). Ignored when `date` is not set.', 'jetpack-backup-pkg' ),
						),
						'status'    => array(
							'type'        => 'string',
							'description' => __( 'Filter by mapped status string (e.g. "finished", "error"). Applied client-side after the server query.', 'jetpack-backup-pkg' ),
							'minLength'   => 1,
						),
						'page'      => array(
							'type'        => 'integer',
							'description' => __( '1-based page number. Ignored when `id` or `date` is set (those are single-result lookups).', 'jetpack-backup-pkg' ),
							'default'     => 1,
							'minimum'     => 1,
						),
						'per_page'  => array(
							'type'        => 'integer',
							'description' => __( 'Cap on items returned per page (default 20, max 100). Also bounds the server-side query window the date filters are evaluated against.', 'jetpack-backup-pkg' ),
							'default'     => self::PER_PAGE_DEFAULT,
							'minimum'     => 1,
							'maximum'     => self::PER_PAGE_MAX,
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'  => 'array',
					'items' => $backup_item_schema,
				),
				'execute_callback'    => array( __CLASS__, 'execute_list_backups' ),
				'permission_callback' => array( __CLASS__, 'can_view_backups' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool',
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-backup/list-restores'       => array(
				'label'               => __( 'List restores', 'jetpack-backup-pkg' ),
				'description'         => __(
					'Return zero or more recent restore operations as an array. Each item: { id, rewind_id, started, last_updated, status, progress }. Pass id to fetch a single restore (returns 0- or 1-element array). Otherwise paginate with page and per_page (default 20, max 100). Read-only and idempotent.',
					'jetpack-backup-pkg'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(
						'id'       => array(
							'type'        => 'string',
							'description' => __( 'Return only the restore with this id. Unknown ids yield an empty array.', 'jetpack-backup-pkg' ),
							'minLength'   => 1,
						),
						'page'     => array(
							'type'        => 'integer',
							'description' => __( 'Page number, 1-based.', 'jetpack-backup-pkg' ),
							'default'     => 1,
							'minimum'     => 1,
						),
						'per_page' => array(
							'type'        => 'integer',
							'description' => __( 'Items per page (default 20, max 100).', 'jetpack-backup-pkg' ),
							'default'     => self::PER_PAGE_DEFAULT,
							'minimum'     => 1,
							'maximum'     => self::PER_PAGE_MAX,
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'  => 'array',
					'items' => $restore_item_schema,
				),
				'execute_callback'    => array( __CLASS__, 'execute_list_restores' ),
				'permission_callback' => array( __CLASS__, 'can_view_backups' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool',
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-backup/request-backup'      => array(
				'label'               => __( 'Request a backup', 'jetpack-backup-pkg' ),
				'description'         => __(
					'Enqueue an on-demand backup of this site. Returns { enqueued: bool, message: string }. Each successful call queues a new backup job; this is a state-changing write, not idempotent. Use get-backup-overview or list-backups afterwards to track progress. Requires the manage_options capability. Returns jetpack_backup_data_unavailable when the upstream service rejects the request.',
					'jetpack-backup-pkg'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'       => 'object',
					'properties' => array(
						'enqueued' => array( 'type' => 'boolean' ),
						'message'  => array( 'type' => 'string' ),
					),
				),
				'execute_callback'    => array( __CLASS__, 'execute_request_backup' ),
				'permission_callback' => array( __CLASS__, 'can_manage_backups' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => false,
					),
					'mcp'          => array(
						'public' => true,
						'type'   => 'tool',
					),
					'show_in_rest' => true,
				),
			),
		);
	}

	/**
	 * Permission check for read abilities. Gates on `manage_options` to
	 * match the existing REST controller (see
	 * Jetpack_Backup::backups_permissions_callback). Kept separate from
	 * `can_manage_backups()` so the read and write surfaces can diverge
	 * later without touching every spec.
	 *
	 * @return bool
	 */
	public static function can_view_backups(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Permission check for write abilities. See `can_view_backups()`.
	 *
	 * @return bool
	 */
	public static function can_manage_backups(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Composite read: each subfield is null on upstream failure rather than
	 * failing the whole call, so a partial wpcom outage degrades to "missing
	 * pieces" instead of "no data." Registration is gated on a Backup product
	 * being loaded (see register_abilities), so this callback assumes the
	 * site has one and only reports on the data it can fetch.
	 *
	 * @param mixed $input Unused; ability accepts no input. Typed `mixed` because
	 *                     the Abilities API may pass the raw caller-supplied value
	 *                     (string/null/array) before our `additionalProperties:false`
	 *                     schema runs — a strict array type would fatal on garbage input.
	 * @return array
	 */
	public static function execute_get_backup_overview( $input = null ): array {
		unset( $input );

		$backups       = self::unwrap_response( Jetpack_Backup::get_recent_backups() );
		$schedule_data = self::unwrap_response( Jetpack_Backup::get_site_backup_schedule_time() );
		$size_data     = self::unwrap_response( Jetpack_Backup::get_site_backup_size() );

		return array(
			'recent_backup_count' => is_array( $backups ) ? count( $backups ) : null,
			'last_backup'         => self::summarize_last_backup( is_array( $backups ) ? ( $backups[0] ?? null ) : null ),
			'schedule'            => self::summarize_schedule( $schedule_data ),
			'storage'             => self::summarize_storage( $size_data ),
		);
	}

	/**
	 * Consolidated read: queries the wpcom activity-log rewindable feed
	 * (server-side date filtering, up to 1000 items/page) and reshapes
	 * activity events back into the backup-item schema. All input filters
	 * land here; the picker is invoked when a `date` + `match` is set.
	 *
	 * @param mixed $input See input_schema on `jetpack-backup/list-backups`.
	 * @return array|WP_Error
	 */
	public static function execute_list_backups( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		// Validate `date` / `date_from` / `date_to` ahead of the round-trip so
		// agents get a specific error rather than a 200 with mysterious empty
		// results. Schema's `format: date-time` is advisory in WP REST.
		foreach ( array( 'date', 'date_from', 'date_to' ) as $key ) {
			if ( isset( $input[ $key ] ) && '' !== $input[ $key ] && null === self::parse_timestamp( $input[ $key ] ) ) {
				return new WP_Error(
					'jetpack_backup_invalid_date',
					/* translators: %s is an input parameter name. */
					sprintf( __( 'The `%s` parameter must be a valid ISO 8601 datetime (e.g. "2026-05-13T14:30:00Z").', 'jetpack-backup-pkg' ), $key )
				);
			}
		}

		$per_page = min(
			self::PER_PAGE_MAX,
			max( 1, isset( $input['per_page'] ) ? (int) $input['per_page'] : self::PER_PAGE_DEFAULT )
		);
		$page     = max( 1, isset( $input['page'] ) ? (int) $input['page'] : 1 );

		// `page` is suppressed on the single-result lookups (id, date+match)
		// — those resolve from page 1 and walking later pages would skip
		// candidates without an obvious benefit.
		$is_single_lookup = ( isset( $input['id'] ) && '' !== $input['id'] )
			|| ( isset( $input['date'] ) && '' !== $input['date'] );

		$query = array(
			'number'     => $per_page,
			'page'       => $is_single_lookup ? 1 : $page,
			'sort_order' => 'desc',
		);
		if ( isset( $input['date_from'] ) && '' !== $input['date_from'] ) {
			$query['after'] = (string) $input['date_from'];
		}
		if ( isset( $input['date_to'] ) && '' !== $input['date_to'] ) {
			$query['before'] = (string) $input['date_to'];
		}

		$envelope = self::unwrap_response( Jetpack_Backup::list_backup_events( $query ) );
		$events   = self::extract_rewindable_items( $envelope );
		if ( ! is_array( $events ) ) {
			return array();
		}

		$items = array_values( array_filter( array_map( array( __CLASS__, 'summarize_backup_event' ), $events ) ) );

		// Single-id filter — same convention as the old endpoint: 0/1-element array.
		if ( isset( $input['id'] ) && is_string( $input['id'] ) && '' !== $input['id'] ) {
			foreach ( $items as $item ) {
				if ( isset( $item['id'] ) && (string) $item['id'] === $input['id'] ) {
					return array( $item );
				}
			}
			return array();
		}

		// Client-side status filter (server-side filters by event name, not status).
		if ( isset( $input['status'] ) && is_string( $input['status'] ) && '' !== $input['status'] ) {
			$want  = $input['status'];
			$items = array_values(
				array_filter(
					$items,
					static function ( $i ) use ( $want ) {
						return ( $i['status'] ?? null ) === $want;
					}
				)
			);
		}

		// Single-match shortcut.
		if ( isset( $input['date'] ) && '' !== $input['date'] ) {
			$target = self::parse_timestamp( $input['date'] );
			$match  = isset( $input['match'] ) && is_string( $input['match'] ) ? $input['match'] : 'on_or_before';
			if ( ! in_array( $match, array( 'on_or_before', 'on_or_after', 'closest' ), true ) ) {
				$match = 'on_or_before';
			}
			$pick = self::pick_backup_near_timestamp( $items, (int) $target, $match );
			return null === $pick ? array() : array( $pick );
		}

		return array_slice( $items, 0, $per_page );
	}

	/**
	 * Execute callback for `jetpack-backup/list-restores`.
	 *
	 * @param mixed $input See input_schema on the ability.
	 * @return array
	 */
	public static function execute_list_restores( $input = null ): array {
		$restores = self::unwrap_response( Jetpack_Backup::get_recent_restores() );
		if ( ! is_array( $restores ) ) {
			return array();
		}

		$summarized = array_map( array( __CLASS__, 'summarize_restore' ), $restores );
		return self::apply_id_or_pagination( $summarized, is_array( $input ) ? $input : array() );
	}

	/**
	 * Pure picker for the `date` + `match` shortcut. Operates on already-
	 * summarized backup items (so it works regardless of which upstream
	 * helper produced them) and uses `started` as the comparison timestamp.
	 *
	 * @param array  $items     Summarized backup items.
	 * @param int    $target_ts Unix timestamp the caller is searching around.
	 * @param string $match     'on_or_before' | 'on_or_after' | 'closest'.
	 * @return array|null The winning item or null when nothing matches.
	 */
	private static function pick_backup_near_timestamp( array $items, int $target_ts, string $match ): ?array {
		$best       = null;
		$best_score = null;

		foreach ( $items as $item ) {
			$ts = self::parse_timestamp( $item['started'] ?? null );
			if ( null === $ts ) {
				continue;
			}

			$diff  = $ts - $target_ts;
			$score = 0;
			switch ( $match ) {
				case 'on_or_after':
					if ( $diff < 0 ) {
						continue 2;
					}
					$score = $diff;
					break;
				case 'closest':
					$score = abs( $diff );
					break;
				case 'on_or_before':
				default:
					if ( $diff > 0 ) {
						continue 2;
					}
					$score = -$diff;
					break;
			}

			if ( null === $best_score || $score < $best_score ) {
				$best       = $item;
				$best_score = $score;
			}
		}

		return $best;
	}

	/**
	 * Pull the activity-event array out of the W3C ActivityStreams envelope
	 * that `/activity/rewindable` returns. The endpoint puts the items in
	 * `current.orderedItems`; older proxy shapes used `orderedItems` at the
	 * top level, so check both before giving up.
	 *
	 * @param mixed $envelope Raw decoded response body.
	 * @return array|null
	 */
	private static function extract_rewindable_items( $envelope ): ?array {
		if ( ! is_array( $envelope ) && ! is_object( $envelope ) ) {
			return null;
		}
		$envelope = (array) $envelope;
		if ( isset( $envelope['current'] ) ) {
			$current = (array) $envelope['current'];
			if ( isset( $current['orderedItems'] ) && is_array( $current['orderedItems'] ) ) {
				return $current['orderedItems'];
			}
		}
		if ( isset( $envelope['orderedItems'] ) && is_array( $envelope['orderedItems'] ) ) {
			return $envelope['orderedItems'];
		}
		return null;
	}

	/**
	 * Translate one /activity/rewindable event into the same backup-item
	 * shape `summarize_backup()` produces, so the ability's output schema
	 * stays stable across the upstream switch. Returns null for events that
	 * don't look like backups (no `rewind_id`).
	 *
	 * @param mixed $raw One element from `current.orderedItems`.
	 * @return array|null
	 */
	private static function summarize_backup_event( $raw ): ?array {
		if ( ! is_array( $raw ) && ! is_object( $raw ) ) {
			return null;
		}
		$raw = (array) $raw;

		$rewind_id = $raw['rewind_id'] ?? null;
		if ( null === $rewind_id || '' === $rewind_id ) {
			return null;
		}

		$published     = isset( $raw['published'] ) && is_string( $raw['published'] ) ? $raw['published'] : null;
		$status_raw    = isset( $raw['status'] ) && is_string( $raw['status'] ) ? $raw['status'] : null;
		$name          = isset( $raw['name'] ) && is_string( $raw['name'] ) ? $raw['name'] : '';
		$is_rewindable = isset( $raw['is_rewindable'] ) ? (bool) $raw['is_rewindable'] : null;

		return array(
			'id'            => (string) $rewind_id,
			'started'       => $published,
			'last_updated'  => $published,
			'status'        => self::map_event_status( $status_raw, $name ),
			'period'        => self::parse_timestamp( $rewind_id ),
			'is_rewindable' => $is_rewindable,
			'has_warnings'  => self::event_has_warnings( $status_raw, $name ),
		);
	}

	/**
	 * Map activity-event status / action-name to the status vocabulary the
	 * ability's output schema uses (the same labels as the old
	 * `/rewind/backups` endpoint: "finished", "error", ...). Falls back to
	 * the raw status when no mapping fits so the caller still sees signal.
	 *
	 * @param string|null $status_raw Activity event status (e.g. "success", "warning", "error").
	 * @param string      $name       Activity name, e.g. "rewind__backup_complete_full".
	 * @return string|null
	 */
	private static function map_event_status( ?string $status_raw, string $name ): ?string {
		if ( 'success' === $status_raw || false !== strpos( $name, 'backup_complete' ) ) {
			return 'finished';
		}
		return $status_raw;
	}

	/**
	 * Derive `has_warnings` from an activity event's status / name.
	 *
	 * @param string|null $status_raw Activity event status.
	 * @param string      $name       Activity name.
	 * @return bool|null
	 */
	private static function event_has_warnings( ?string $status_raw, string $name ): ?bool {
		if ( 'warning' === $status_raw ) {
			return true;
		}
		if ( 'success' === $status_raw || false !== strpos( $name, 'backup_complete' ) ) {
			return false;
		}
		return null;
	}

	/**
	 * Coerce an ISO 8601 string, RFC-style date string, or numeric unix
	 * timestamp to an int unix timestamp. Returns null for anything that
	 * can't be unambiguously parsed (instead of strtotime's `false`, which
	 * is also a valid timestamp for 1969-12-31).
	 *
	 * Fractional numeric strings (e.g. rewind_id "1778804242.107") are
	 * accepted — the fractional part is truncated.
	 *
	 * @param mixed $value Source value (string, int, float, or anything else).
	 * @return int|null
	 */
	private static function parse_timestamp( $value ): ?int {
		if ( is_int( $value ) ) {
			return $value;
		}
		if ( is_float( $value ) ) {
			return (int) $value;
		}
		if ( is_string( $value ) && '' !== $value ) {
			if ( is_numeric( $value ) ) {
				return (int) $value;
			}
			$ts = strtotime( $value );
			return false === $ts ? null : $ts;
		}
		return null;
	}

	/**
	 * Enqueue an on-demand backup. Registration is gated on a Backup product
	 * being loaded so we assume one exists by the time this runs. Returns
	 * WP_Error only when the upstream connection itself fails so agents can
	 * retry strategically.
	 *
	 * @param mixed $input Unused; see note on execute_get_backup_overview().
	 * @return array|WP_Error
	 */
	public static function execute_request_backup( $input = null ) {
		unset( $input );

		// wpcom can return HTTP 200 with `{ success: false, error: ... }`; treat
		// that as a failure rather than reporting the backup was enqueued.
		$result = self::unwrap_response( Jetpack_Backup::enqueue_backup() );
		if ( ! is_array( $result ) || empty( $result['success'] ) ) {
			return new WP_Error(
				'jetpack_backup_data_unavailable',
				__( 'The backup service did not accept the request. The connection to WordPress.com may be temporarily unavailable; retry shortly.', 'jetpack-backup-pkg' )
			);
		}

		return array(
			'enqueued' => true,
			'message'  => __( 'Backup enqueued. Use jetpack-backup/list-backups to monitor progress.', 'jetpack-backup-pkg' ),
		);
	}

	/**
	 * Normalize a Jetpack_Backup helper result (WP_REST_Response, array, null,
	 * or WP_Error) to a plain value or null. Jetpack_Backup uses
	 * `rest_ensure_response()` on success and returns null on http failure, so
	 * abilities need both shapes flattened before summarising.
	 *
	 * @param mixed $maybe_response Result of a Jetpack_Backup helper call.
	 * @return mixed
	 */
	private static function unwrap_response( $maybe_response ) {
		if ( null === $maybe_response || is_wp_error( $maybe_response ) ) {
			return null;
		}
		if ( $maybe_response instanceof WP_REST_Response ) {
			return $maybe_response->get_data();
		}
		return $maybe_response;
	}

	/**
	 * Slice the (already-summarized) list down to a single id, or apply
	 * page/per_page pagination. Always returns the same item shape.
	 *
	 * @param array $items Summarized items.
	 * @param array $input Sanitized input.
	 * @return array
	 */
	private static function apply_id_or_pagination( array $items, array $input ): array {
		if ( isset( $input['id'] ) && is_string( $input['id'] ) && '' !== $input['id'] ) {
			foreach ( $items as $item ) {
				if ( isset( $item['id'] ) && (string) $item['id'] === $input['id'] ) {
					return array( $item );
				}
			}
			return array();
		}

		$page     = max( 1, (int) ( $input['page'] ?? 1 ) );
		$per_page = min( self::PER_PAGE_MAX, max( 1, (int) ( $input['per_page'] ?? self::PER_PAGE_DEFAULT ) ) );

		return array_slice( $items, ( $page - 1 ) * $per_page, $per_page );
	}

	/**
	 * High-signal summary used inside `last_backup` for the overview. Same as
	 * `summarize_backup` minus the `started`/`period` fields which the agent
	 * doesn't need at a glance.
	 *
	 * @param mixed $raw One element from the upstream backups list.
	 * @return array|null
	 */
	private static function summarize_last_backup( $raw ): ?array {
		if ( ! is_array( $raw ) && ! is_object( $raw ) ) {
			return null;
		}
		return array_diff_key(
			self::summarize_backup( $raw ),
			array_flip( array( 'started', 'period' ) )
		);
	}

	/**
	 * Summarize a `/rewind/backups` payload item using `rewind_id` as the
	 * canonical `id`. The numeric attempt id wpcom also exposes is
	 * internal to VaultPress and can't be looked up via any other endpoint,
	 * so it's intentionally dropped from the agent-facing shape — see the
	 * note on `$backup_item_schema` in `get_abilities()`.
	 *
	 * @param mixed $raw Upstream backup item.
	 * @return array
	 */
	private static function summarize_backup( $raw ): array {
		$raw       = (array) $raw;
		$rewind_id = $raw['rewind_id'] ?? null;
		return array(
			'id'            => ( null === $rewind_id || '' === $rewind_id ) ? null : (string) $rewind_id,
			'started'       => $raw['started'] ?? null,
			'last_updated'  => $raw['last_updated'] ?? null,
			'status'        => $raw['status'] ?? null,
			'period'        => $raw['period'] ?? null,
			'is_rewindable' => isset( $raw['is_rewindable'] ) ? (bool) $raw['is_rewindable'] : null,
			'has_warnings'  => isset( $raw['has_warnings'] ) ? (bool) $raw['has_warnings'] : null,
		);
	}

	/**
	 * Summarize a `/rewind/restores` payload item. `id` is the rewind_id
	 * of the backup being restored to — same canonical id system as
	 * `summarize_backup()`.
	 *
	 * @param mixed $raw Upstream restore item.
	 * @return array
	 */
	private static function summarize_restore( $raw ): array {
		$raw       = (array) $raw;
		$rewind_id = $raw['rewind_id'] ?? null;
		return array(
			'id'           => ( null === $rewind_id || '' === $rewind_id ) ? null : (string) $rewind_id,
			'started'      => $raw['started'] ?? null,
			'last_updated' => $raw['last_updated'] ?? null,
			'status'       => $raw['status'] ?? null,
			'progress'     => isset( $raw['progress'] ) ? (int) $raw['progress'] : null,
		);
	}

	/**
	 * Summarize the wpcom schedule payload to `{ hour, minute }`.
	 *
	 * @param mixed $raw Upstream schedule payload.
	 * @return array|null
	 */
	private static function summarize_schedule( $raw ): ?array {
		if ( ! is_array( $raw ) && ! is_object( $raw ) ) {
			return null;
		}
		$raw = (array) $raw;
		return array(
			'hour'   => isset( $raw['hour'] ) ? (int) $raw['hour'] : null,
			'minute' => isset( $raw['minute'] ) ? (int) $raw['minute'] : null,
		);
	}

	/**
	 * Maps both the production wpcom field names (`size_in_bytes`, `storage_limit_bytes`)
	 * and shorter aliases (`used_bytes`, `limit_bytes`) so the ability stays stable
	 * if the upstream payload is renamed.
	 *
	 * @param mixed $raw Upstream storage payload.
	 * @return array|null
	 */
	private static function summarize_storage( $raw ): ?array {
		if ( ! is_array( $raw ) && ! is_object( $raw ) ) {
			return null;
		}
		$raw         = (array) $raw;
		$used_bytes  = $raw['size_in_bytes'] ?? ( $raw['used_bytes'] ?? null );
		$limit_bytes = $raw['storage_limit_bytes'] ?? ( $raw['limit_bytes'] ?? null );
		return array(
			'used_bytes'  => null === $used_bytes ? null : (int) $used_bytes,
			'limit_bytes' => null === $limit_bytes ? null : (int) $limit_bytes,
		);
	}
}
