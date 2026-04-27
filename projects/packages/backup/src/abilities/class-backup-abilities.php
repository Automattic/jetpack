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

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions for older-WP compatibility runs.

namespace Automattic\Jetpack\Backup\V0005\Abilities;

use Automattic\Jetpack\Backup\V0005\Jetpack_Backup;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_Error;
use WP_REST_Response;

/**
 * Registers Jetpack Backup abilities with the WordPress Abilities API.
 *
 * Exposes a small, agent-friendly surface for site backups:
 *
 * - `jetpack-backup/get-backup-overview` — single-call site backup health snapshot.
 * - `jetpack-backup/get-backups` — recent backups with optional id/pagination filters.
 * - `jetpack-backup/get-restores` — recent restores with optional id/pagination filters.
 * - `jetpack-backup/run-backup` — enqueue an on-demand backup.
 */
class Backup_Abilities extends Registrar {

	const PER_PAGE_DEFAULT = 20;
	const PER_PAGE_MAX     = 100;

	public static function get_category_slug(): string {
		return 'jetpack-backup';
	}

	public static function get_category_definition(): array {
		return array(
			// "Jetpack Backup" is a product name and should not be translated.
			'label'       => 'Jetpack Backup',
			'description' => __( 'Abilities for inspecting and managing Jetpack Backup on this site.', 'jetpack-backup-pkg' ),
		);
	}

	public static function get_abilities(): array {
		$backup_item_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'             => array( 'type' => array( 'string', 'integer' ) ),
				'rewind_id'      => array( 'type' => array( 'string', 'null' ) ),
				'started'        => array( 'type' => array( 'string', 'null' ) ),
				'last_updated'   => array( 'type' => array( 'string', 'null' ) ),
				'status'         => array( 'type' => array( 'string', 'null' ) ),
				'period'         => array( 'type' => array( 'string', 'integer', 'null' ) ),
				'is_rewindable'  => array( 'type' => array( 'boolean', 'null' ) ),
				'has_warnings'   => array( 'type' => array( 'boolean', 'null' ) ),
			),
		);

		$restore_item_schema = array(
			'type'       => 'object',
			'properties' => array(
				'id'           => array( 'type' => array( 'string', 'integer' ) ),
				'rewind_id'    => array( 'type' => array( 'string', 'null' ) ),
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
					'Return a single-call snapshot of the site backup state: { has_plan, last_backup, recent_backup_count, schedule, storage }. Use this to answer "is my site protected?" before deciding whether to call get-backups, get-restores, or run-backup. Read-only and idempotent. Fields whose backing service is unreachable come back as null rather than failing the call. Requires a Jetpack Backup plan and the manage_options capability; sites without a plan return has_plan=false and the rest of the fields null.',
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
						'has_plan'             => array( 'type' => 'boolean' ),
						'recent_backup_count'  => array( 'type' => array( 'integer', 'null' ) ),
						'last_backup'          => array(
							'type'       => array( 'object', 'null' ),
							'properties' => array(
								'id'            => array( 'type' => array( 'string', 'integer' ) ),
								'rewind_id'     => array( 'type' => array( 'string', 'null' ) ),
								'last_updated'  => array( 'type' => array( 'string', 'null' ) ),
								'status'        => array( 'type' => array( 'string', 'null' ) ),
								'is_rewindable' => array( 'type' => array( 'boolean', 'null' ) ),
								'has_warnings'  => array( 'type' => array( 'boolean', 'null' ) ),
							),
						),
						'schedule'             => array(
							'type'       => array( 'object', 'null' ),
							'properties' => array(
								'hour'   => array( 'type' => array( 'integer', 'null' ) ),
								'minute' => array( 'type' => array( 'integer', 'null' ) ),
							),
						),
						'storage'              => array(
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
					'show_in_rest' => true,
				),
			),

			'jetpack-backup/get-backups' => array(
				'label'               => __( 'Get backups', 'jetpack-backup-pkg' ),
				'description'         => __(
					'Return zero or more recent backups as an array. Each item summarises one backup: { id, rewind_id, started, last_updated, status, period, is_rewindable, has_warnings }. Pass id to fetch a single backup (returns 0- or 1-element array; unknown ids yield an empty array). Otherwise paginate with page (default 1) and per_page (default 20, max 100). Read-only and idempotent. Requires a Jetpack Backup plan; sites without a plan return an empty array.',
					'jetpack-backup-pkg'
				),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(
						'id'       => array(
							'type'        => 'string',
							'description' => __( 'Return only the backup with this id (string or numeric). Unknown ids yield an empty array, not an error.', 'jetpack-backup-pkg' ),
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
					'items' => $backup_item_schema,
				),
				'execute_callback'    => array( __CLASS__, 'execute_get_backups' ),
				'permission_callback' => array( __CLASS__, 'can_view_backups' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-backup/get-restores' => array(
				'label'               => __( 'Get restores', 'jetpack-backup-pkg' ),
				'description'         => __(
					'Return zero or more recent restore operations as an array. Each item: { id, rewind_id, started, last_updated, status, progress }. Pass id to fetch a single restore (returns 0- or 1-element array). Otherwise paginate with page and per_page (default 20, max 100). Read-only and idempotent. Requires a Jetpack Backup plan; sites without a plan return an empty array.',
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
				'execute_callback'    => array( __CLASS__, 'execute_get_restores' ),
				'permission_callback' => array( __CLASS__, 'can_view_backups' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),

			'jetpack-backup/run-backup' => array(
				'label'               => __( 'Run a backup', 'jetpack-backup-pkg' ),
				'description'         => __(
					'Enqueue an on-demand backup of this site. Returns { enqueued: bool, message: string }. Each successful call queues a new backup job; this is a state-changing write, not idempotent. Use get-backup-overview or get-backups afterwards to track progress. Requires a Jetpack Backup plan and the manage_options capability. Returns jetpack_backup_no_plan when the site has no active backup plan.',
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
				'execute_callback'    => array( __CLASS__, 'execute_run_backup' ),
				'permission_callback' => array( __CLASS__, 'can_manage_backups' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => false,
					),
					'show_in_rest' => true,
				),
			),
		);
	}

	// Both checks gate on `manage_options` to match the existing REST controller
	// (see Jetpack_Backup::backups_permissions_callback). They are kept as
	// separate methods so the read and write surfaces can diverge later without
	// touching every spec.

	public static function can_view_backups(): bool {
		return current_user_can( 'manage_options' );
	}

	public static function can_manage_backups(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Composite read: each subfield is null on upstream failure rather than
	 * failing the whole call, so a partial wpcom outage degrades to "missing
	 * pieces" instead of "no data."
	 *
	 * @param array|null $input Unused; ability accepts no input.
	 * @return array
	 */
	public static function execute_get_backup_overview( ?array $input = null ): array {
		unset( $input );

		if ( ! Jetpack_Backup::has_backup_plan() ) {
			return array(
				'has_plan'            => false,
				'recent_backup_count' => null,
				'last_backup'         => null,
				'schedule'            => null,
				'storage'             => null,
			);
		}

		$backups       = self::unwrap_response( Jetpack_Backup::get_recent_backups() );
		$schedule_data = self::unwrap_response( Jetpack_Backup::get_site_backup_schedule_time() );
		$size_data     = self::unwrap_response( Jetpack_Backup::get_site_backup_size() );

		return array(
			'has_plan'            => true,
			'recent_backup_count' => is_array( $backups ) ? count( $backups ) : null,
			'last_backup'         => self::summarize_last_backup( is_array( $backups ) ? ( $backups[0] ?? null ) : null ),
			'schedule'            => self::summarize_schedule( $schedule_data ),
			'storage'             => self::summarize_storage( $size_data ),
		);
	}

	public static function execute_get_backups( ?array $input = null ): array {
		$backups = self::unwrap_response( Jetpack_Backup::get_recent_backups() );
		if ( ! is_array( $backups ) ) {
			return array();
		}

		$summarized = array_map( array( __CLASS__, 'summarize_backup' ), $backups );
		return self::apply_id_or_pagination( $summarized, $input ?? array() );
	}

	public static function execute_get_restores( ?array $input = null ): array {
		$restores = self::unwrap_response( Jetpack_Backup::get_recent_restores() );
		if ( ! is_array( $restores ) ) {
			return array();
		}

		$summarized = array_map( array( __CLASS__, 'summarize_restore' ), $restores );
		return self::apply_id_or_pagination( $summarized, $input ?? array() );
	}

	/**
	 * Enqueue an on-demand backup. Returns WP_Error when the site has no plan
	 * or when the upstream service is unreachable so agents can retry strategically.
	 *
	 * @param array|null $input Unused.
	 * @return array|WP_Error
	 */
	public static function execute_run_backup( ?array $input = null ) {
		unset( $input );

		if ( ! Jetpack_Backup::has_backup_plan() ) {
			return new WP_Error(
				'jetpack_backup_no_plan',
				__( 'This site does not have an active Jetpack Backup plan. Upgrade the plan before retrying.', 'jetpack-backup-pkg' )
			);
		}

		$result = self::unwrap_response( Jetpack_Backup::enqueue_backup() );
		if ( null === $result ) {
			return new WP_Error(
				'jetpack_backup_data_unavailable',
				__( 'The backup service did not accept the request. The connection to WordPress.com may be temporarily unavailable; retry shortly.', 'jetpack-backup-pkg' )
			);
		}

		return array(
			'enqueued' => true,
			'message'  => __( 'Backup enqueued. Use jetpack-backup/get-backups to monitor progress.', 'jetpack-backup-pkg' ),
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
	 * @param mixed $raw Upstream backup item.
	 * @return array
	 */
	private static function summarize_backup( $raw ): array {
		$raw = (array) $raw;
		return array(
			'id'            => $raw['id'] ?? null,
			'rewind_id'     => $raw['rewind_id'] ?? null,
			'started'       => $raw['started'] ?? null,
			'last_updated'  => $raw['last_updated'] ?? null,
			'status'        => $raw['status'] ?? null,
			'period'        => $raw['period'] ?? null,
			'is_rewindable' => isset( $raw['is_rewindable'] ) ? (bool) $raw['is_rewindable'] : null,
			'has_warnings'  => isset( $raw['has_warnings'] ) ? (bool) $raw['has_warnings'] : null,
		);
	}

	/**
	 * @param mixed $raw Upstream restore item.
	 * @return array
	 */
	private static function summarize_restore( $raw ): array {
		$raw = (array) $raw;
		return array(
			'id'           => $raw['id'] ?? null,
			'rewind_id'    => $raw['rewind_id'] ?? null,
			'started'      => $raw['started'] ?? null,
			'last_updated' => $raw['last_updated'] ?? null,
			'status'       => $raw['status'] ?? null,
			'progress'     => isset( $raw['progress'] ) ? (int) $raw['progress'] : null,
		);
	}

	/**
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
