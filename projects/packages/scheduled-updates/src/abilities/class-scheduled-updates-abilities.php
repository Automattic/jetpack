<?php
/**
 * Jetpack Scheduled Updates Abilities Registration.
 *
 * Registers Jetpack Scheduled Updates abilities with the WordPress Abilities
 * API so AI agents can manage plugin update schedules through the standard
 * `wp-abilities/v1` REST surface.
 *
 * @package automattic/scheduled-updates
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Scheduled_Updates\Abilities;

use Automattic\Jetpack\Scheduled_Updates;
use Automattic\Jetpack\Scheduled_Updates_Active;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_Error;

/**
 * Registers Jetpack Scheduled Updates abilities with the WordPress Abilities API.
 *
 * Exposes the full schedule lifecycle — list, create, update, delete, run-now —
 * so AI agents can manage plugin update schedules without reverse-engineering
 * cron internals or chaining the WPCOM `update-schedules` REST endpoints.
 *
 * Tokens we deliberately spend the bytes on:
 *  - Each schedule entry returns the compact `{ id, plugins, schedule,
 *    last_run_status, last_run_timestamp, active }` shape, not the raw cron
 *    event object — agents shouldn't need to know about `hook`, `args`, or
 *    `interval` in seconds.
 *  - Mutations return `changed` + (for updates) `changed_fields`, so idempotent
 *    no-op replays don't waste a follow-up read to detect "did it actually
 *    change anything?".
 */
class Scheduled_Updates_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-scheduled-updates';
	const ERROR_PREFIX  = 'jetpack_scheduled_updates_';

	/**
	 * Allowed `schedule.interval` values, mirroring the REST controller's enum.
	 */
	const INTERVALS = array( 'daily', 'weekly' );

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return self::CATEGORY_SLUG;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack" is a product name and should not be translated.
			'label'       => 'Jetpack Scheduled Updates',
			'description' => __( 'Abilities for listing, creating, updating, deleting, and running Jetpack plugin update schedules.', 'jetpack-scheduled-updates' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-scheduled-updates/list-schedules'   => self::spec_list_schedules(),
			'jetpack-scheduled-updates/create-schedule'  => self::spec_create_schedule(),
			'jetpack-scheduled-updates/update-schedule'  => self::spec_update_schedule(),
			'jetpack-scheduled-updates/delete-schedule'  => self::spec_delete_schedule(),
			'jetpack-scheduled-updates/run-schedule-now' => self::spec_run_schedule_now(),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Ability specs
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Spec: jetpack-scheduled-updates/list-schedules.
	 */
	private static function spec_list_schedules(): array {
		return array(
			'label'               => __( 'List Jetpack scheduled-update jobs', 'jetpack-scheduled-updates' ),
			'description'         => __(
				'Return all configured plugin update schedules in one call. Each entry has the shape { id, plugins: [string], schedule: { interval, next_run, timestamp }, last_run_status, last_run_timestamp, active }. `id` is the deterministic md5 schedule id derived from the plugin list. `plugins` is the slug list (e.g. "akismet/akismet.php"). `schedule.interval` is one of "daily" or "weekly"; `schedule.timestamp` is the Unix timestamp of the next scheduled run; `schedule.next_run` is the same value formatted as a "YYYY-MM-DD HH:mm:ss" UTC string for human readability. `last_run_status` is one of WordPress\'s scheduled-update log states ("success", "failure", or null when the schedule has never run). `last_run_timestamp` is null when the schedule has never run. `active` is false when the schedule has been explicitly paused. Pass an optional `id` to filter to a single schedule — returns a 0- or 1-element array, never a WP_Error; unknown ids return an empty array.',
				'jetpack-scheduled-updates'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => array(
					'id' => array(
						'type'        => 'string',
						'description' => __( 'Optional schedule id to filter by. Unknown ids return an empty array.', 'jetpack-scheduled-updates' ),
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'  => 'array',
				'items' => array(
					'type'       => 'object',
					'properties' => array(
						'id'                 => array( 'type' => 'string' ),
						'plugins'            => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
						'schedule'           => array( 'type' => 'object' ),
						'last_run_status'    => array( 'type' => array( 'string', 'null' ) ),
						'last_run_timestamp' => array( 'type' => array( 'integer', 'null' ) ),
						'active'             => array( 'type' => 'boolean' ),
					),
				),
			),
			'execute_callback'    => array( __CLASS__, 'list_schedules' ),
			'permission_callback' => array( __CLASS__, 'can_manage_schedules' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Spec: jetpack-scheduled-updates/create-schedule.
	 */
	private static function spec_create_schedule(): array {
		return array(
			'label'               => __( 'Create a Jetpack scheduled-update job', 'jetpack-scheduled-updates' ),
			'description'         => __(
				'Schedule one or more plugins to be updated on a recurring cadence. Shape in: { plugins: [string], schedule: { interval: "daily" | "weekly", timestamp: int } }. `plugins` is the list of plugin slugs to update (e.g. "akismet/akismet.php"); each plugin must already be installed on the site. `schedule.timestamp` is the Unix timestamp of the first scheduled run; subsequent runs happen every interval thereafter. Returns { id, schedule } where `id` is the deterministic md5 schedule id (also the value to pass to update-schedule, delete-schedule, and run-schedule-now). Idempotent only at the id level — two creates with the same plugin list collide because they produce the same id. Two schedules at the same exact timestamp are also rejected by the underlying controller.',
				'jetpack-scheduled-updates'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'plugins', 'schedule' ),
				'properties'           => array(
					'plugins'  => array(
						'type'        => 'array',
						'description' => __( 'List of plugin slugs to update on this schedule.', 'jetpack-scheduled-updates' ),
						'items'       => array( 'type' => 'string' ),
						'minItems'    => 1,
						'maxItems'    => 10,
					),
					'schedule' => self::schedule_input_schema(),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'id'       => array( 'type' => 'string' ),
					'schedule' => array( 'type' => 'object' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'create_schedule' ),
			'permission_callback' => array( __CLASS__, 'can_manage_schedules' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => false,
					'destructive' => true,
					'idempotent'  => false,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Spec: jetpack-scheduled-updates/update-schedule.
	 */
	private static function spec_update_schedule(): array {
		return array(
			'label'               => __( 'Update a Jetpack scheduled-update job', 'jetpack-scheduled-updates' ),
			'description'         => __(
				'Update an existing scheduled-update job by id. Shape in: { id, plugins?, schedule? } — at least one of `plugins` or `schedule` must be present. Returns { id, changed, changed_fields } where `id` is the (possibly new) deterministic schedule id (the id changes when `plugins` changes because the id is the md5 of the plugin list), `changed` is true when the underlying schedule was rewritten, and `changed_fields` is a subset of [ "plugins", "schedule" ] listing which inputs differed from the prior schedule. Idempotent — calling with the same values returns changed=false and an empty `changed_fields`. Fails with jetpack_scheduled_updates_not_found when no schedule matches `id`.',
				'jetpack-scheduled-updates'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'id' ),
				'properties'           => array(
					'id'       => array(
						'type'        => 'string',
						'description' => __( 'Schedule id to update.', 'jetpack-scheduled-updates' ),
					),
					'plugins'  => array(
						'type'        => 'array',
						'description' => __( 'New plugin slug list for this schedule.', 'jetpack-scheduled-updates' ),
						'items'       => array( 'type' => 'string' ),
						'minItems'    => 1,
						'maxItems'    => 10,
					),
					'schedule' => self::schedule_input_schema(),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'id'             => array( 'type' => 'string' ),
					'changed'        => array( 'type' => 'boolean' ),
					'changed_fields' => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
				),
			),
			'execute_callback'    => array( __CLASS__, 'update_schedule' ),
			'permission_callback' => array( __CLASS__, 'can_manage_schedules' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => false,
					'destructive' => true,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Spec: jetpack-scheduled-updates/delete-schedule.
	 */
	private static function spec_delete_schedule(): array {
		return array(
			'label'               => __( 'Delete a Jetpack scheduled-update job', 'jetpack-scheduled-updates' ),
			'description'         => __(
				'Delete a scheduled-update job by id. Shape in: { id }. Returns { id, deleted, changed } where `deleted` is true if no schedule with that id exists after the call (including the case where it was already gone before the call), and `changed` is true only when this call actually removed a schedule. Idempotent — deleting an already-deleted schedule returns deleted=true, changed=false.',
				'jetpack-scheduled-updates'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'id' ),
				'properties'           => array(
					'id' => array(
						'type'        => 'string',
						'description' => __( 'Schedule id to delete.', 'jetpack-scheduled-updates' ),
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'id'      => array( 'type' => 'string' ),
					'deleted' => array( 'type' => 'boolean' ),
					'changed' => array( 'type' => 'boolean' ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'delete_schedule' ),
			'permission_callback' => array( __CLASS__, 'can_manage_schedules' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => false,
					'destructive' => true,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Spec: jetpack-scheduled-updates/run-schedule-now.
	 */
	private static function spec_run_schedule_now(): array {
		return array(
			'label'               => __( 'Run a Jetpack scheduled-update job immediately', 'jetpack-scheduled-updates' ),
			'description'         => __(
				'Force a scheduled-update job to run immediately, in addition to its normal cadence. Shape in: { id }. Returns { id, dispatched, job_id } where `dispatched` is true when the run was queued, and `job_id` is the cron one-off identifier (Unix timestamp of the queued run). NOT idempotent — re-running queues another run. Use sparingly: each call hits the WordPress.com Atomic update pipeline. Fails with jetpack_scheduled_updates_not_found when no schedule matches `id`, or jetpack_scheduled_updates_dispatch_failed when WP-Cron refuses the one-off (e.g. event collision).',
				'jetpack-scheduled-updates'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'required'             => array( 'id' ),
				'properties'           => array(
					'id' => array(
						'type'        => 'string',
						'description' => __( 'Schedule id to run.', 'jetpack-scheduled-updates' ),
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'id'         => array( 'type' => 'string' ),
					'dispatched' => array( 'type' => 'boolean' ),
					'job_id'     => array( 'type' => array( 'integer', 'null' ) ),
				),
			),
			'execute_callback'    => array( __CLASS__, 'run_schedule_now' ),
			'permission_callback' => array( __CLASS__, 'can_manage_schedules' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => false,
					'destructive' => true,
					'idempotent'  => false,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Shared input schema for the `schedule` object on create + update.
	 *
	 * Kept as a helper so the create/update specs agree on field shape and so
	 * any tightening (e.g. minimum timestamp) lands in one place.
	 */
	private static function schedule_input_schema(): array {
		return array(
			'type'        => 'object',
			'description' => __( 'Recurrence definition for the schedule.', 'jetpack-scheduled-updates' ),
			'required'    => array( 'interval', 'timestamp' ),
			'properties'  => array(
				'interval'  => array(
					'type'        => 'string',
					'description' => __( 'How often the schedule recurs.', 'jetpack-scheduled-updates' ),
					'enum'        => self::INTERVALS,
				),
				'timestamp' => array(
					'type'        => 'integer',
					'description' => __( 'Unix timestamp (UTC) of the first scheduled run.', 'jetpack-scheduled-updates' ),
					'minimum'     => 1,
				),
			),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Permission callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Permission check for all scheduled-update abilities.
	 *
	 * Mirrors the underlying `WPCOM_REST_API_V2_Endpoint_Update_Schedules`
	 * controller, which gates every method on `update_plugins`. We do not
	 * split read vs. write because both surfaces touch the plugin-update
	 * cron list, which leaks the site's plugin inventory — readers should
	 * also need to be admin.
	 *
	 * @return bool
	 */
	public static function can_manage_schedules(): bool {
		return current_user_can( 'update_plugins' );
	}

	/*
	---------------------------------------------------------------------
	 * Execute callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Execute: list-schedules.
	 *
	 * @param array|null $input Optional input matching the ability's input_schema.
	 * @return array
	 */
	public static function list_schedules( $input = null ): array {
		$input  = is_array( $input ) ? $input : array();
		$filter = isset( $input['id'] ) && is_string( $input['id'] ) && '' !== $input['id'] ? $input['id'] : null;

		$events = self::get_scheduled_events();
		$out    = array();
		foreach ( $events as $schedule_id => $event ) {
			if ( null !== $filter && $filter !== $schedule_id ) {
				continue;
			}
			$out[] = self::project_event( (string) $schedule_id, $event );
		}
		return $out;
	}

	/**
	 * Execute: create-schedule.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function create_schedule( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$plugins = self::sanitize_plugins( $input['plugins'] ?? null );
		if ( is_wp_error( $plugins ) ) {
			return $plugins;
		}

		$schedule = self::sanitize_schedule( $input['schedule'] ?? null );
		if ( is_wp_error( $schedule ) ) {
			return $schedule;
		}

		$request = self::make_rest_request(
			'POST',
			'/wpcom/v2/update-schedules',
			array(
				'plugins'  => $plugins,
				'schedule' => $schedule,
			)
		);

		$response = self::dispatch_request( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		// The endpoint returns the bare id string.
		$id = is_string( $response ) ? $response : (string) $response;

		return array(
			'id'       => $id,
			'schedule' => $schedule,
		);
	}

	/**
	 * Execute: update-schedule.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function update_schedule( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$id = isset( $input['id'] ) && is_string( $input['id'] ) ? $input['id'] : '';
		if ( '' === $id ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'missing_id',
				__( 'An `id` is required.', 'jetpack-scheduled-updates' )
			);
		}

		$events = self::get_scheduled_events();
		if ( ! isset( $events[ $id ] ) ) {
			return self::not_found_error( $id );
		}

		// At least one mutable field must be supplied.
		$has_plugins  = array_key_exists( 'plugins', $input );
		$has_schedule = array_key_exists( 'schedule', $input );
		if ( ! $has_plugins && ! $has_schedule ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'no_changes',
				__( 'Provide at least one of `plugins` or `schedule` to update.', 'jetpack-scheduled-updates' )
			);
		}

		$existing      = $events[ $id ];
		$existing_args = is_array( $existing->args ?? null ) ? array_values( $existing->args ) : array();
		sort( $existing_args, SORT_NATURAL | SORT_FLAG_CASE );

		$next_plugins = $existing_args;
		if ( $has_plugins ) {
			$sanitized = self::sanitize_plugins( $input['plugins'] );
			if ( is_wp_error( $sanitized ) ) {
				return $sanitized;
			}
			$next_plugins = $sanitized;
		}

		$existing_schedule = array(
			'interval'  => (string) ( $existing->schedule ?? '' ),
			'timestamp' => (int) ( $existing->timestamp ?? 0 ),
		);

		$next_schedule = $existing_schedule;
		if ( $has_schedule ) {
			$sanitized = self::sanitize_schedule( $input['schedule'] );
			if ( is_wp_error( $sanitized ) ) {
				return $sanitized;
			}
			$next_schedule = $sanitized;
		}

		// Detect no-op early so we don't churn cron + sync option for free.
		$existing_sorted = $existing_args;
		$next_sorted     = $next_plugins;
		sort( $existing_sorted, SORT_NATURAL | SORT_FLAG_CASE );
		sort( $next_sorted, SORT_NATURAL | SORT_FLAG_CASE );

		$changed_fields = array();
		if ( $existing_sorted !== $next_sorted ) {
			$changed_fields[] = 'plugins';
		}
		if ( $existing_schedule !== $next_schedule ) {
			$changed_fields[] = 'schedule';
		}

		if ( empty( $changed_fields ) ) {
			return array(
				'id'             => $id,
				'changed'        => false,
				'changed_fields' => array(),
			);
		}

		$request = self::make_rest_request(
			'PUT',
			'/wpcom/v2/update-schedules/' . $id,
			array(
				'plugins'  => $next_plugins,
				'schedule' => $next_schedule,
			)
		);
		// The controller reads `schedule_id` off the request, not just the URL.
		$request->set_param( 'schedule_id', $id );

		$response = self::dispatch_request( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		// `update_item` returns the response from `create_item`, which is the new id.
		$new_id = is_string( $response ) ? $response : (string) $response;

		return array(
			'id'             => $new_id,
			'changed'        => true,
			'changed_fields' => array_values( $changed_fields ),
		);
	}

	/**
	 * Execute: delete-schedule.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function delete_schedule( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$id = isset( $input['id'] ) && is_string( $input['id'] ) ? $input['id'] : '';
		if ( '' === $id ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'missing_id',
				__( 'An `id` is required.', 'jetpack-scheduled-updates' )
			);
		}

		$events = self::get_scheduled_events();
		if ( ! isset( $events[ $id ] ) ) {
			// Idempotent delete: already gone.
			return array(
				'id'      => $id,
				'deleted' => true,
				'changed' => false,
			);
		}

		$request = self::make_rest_request( 'DELETE', '/wpcom/v2/update-schedules/' . $id );
		$request->set_param( 'schedule_id', $id );

		$response = self::dispatch_request( $request );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return array(
			'id'      => $id,
			'deleted' => true,
			'changed' => true,
		);
	}

	/**
	 * Execute: run-schedule-now.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function run_schedule_now( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$id = isset( $input['id'] ) && is_string( $input['id'] ) ? $input['id'] : '';
		if ( '' === $id ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'missing_id',
				__( 'An `id` is required.', 'jetpack-scheduled-updates' )
			);
		}

		$events = self::get_scheduled_events();
		if ( ! isset( $events[ $id ] ) ) {
			return self::not_found_error( $id );
		}

		$event = $events[ $id ];
		$args  = is_array( $event->args ?? null ) ? array_values( $event->args ) : array();

		// Queue a single one-off run a few seconds in the future. The existing
		// recurring schedule keeps running on its normal cadence — this is a
		// force-run in addition to, not instead of, the next scheduled run.
		$run_at = time() + 5;
		$queued = wp_schedule_single_event( $run_at, Scheduled_Updates::PLUGIN_CRON_HOOK, $args, true );

		if ( is_wp_error( $queued ) || false === $queued ) {
			$message = is_wp_error( $queued )
				? $queued->get_error_message()
				: __( 'WP-Cron refused to queue the one-off run.', 'jetpack-scheduled-updates' );
			return new WP_Error(
				self::ERROR_PREFIX . 'dispatch_failed',
				$message
			);
		}

		return array(
			'id'         => $id,
			'dispatched' => true,
			'job_id'     => $run_at,
		);
	}

	/*
	---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Return the current schedule events keyed by schedule id, defensively
	 * coercing the WP-Cron return to an array.
	 *
	 * @return array<string, object>
	 */
	private static function get_scheduled_events(): array {
		$events = wp_get_scheduled_events( Scheduled_Updates::PLUGIN_CRON_HOOK );
		return is_array( $events ) ? $events : array();
	}

	/**
	 * Project a raw cron event into the compact, agent-friendly shape.
	 *
	 * @param string $schedule_id The schedule id.
	 * @param object $event       The raw cron event object.
	 * @return array
	 */
	private static function project_event( string $schedule_id, $event ): array {
		$timestamp = isset( $event->timestamp ) ? (int) $event->timestamp : 0;
		$interval  = isset( $event->schedule ) ? (string) $event->schedule : '';
		$plugins   = is_array( $event->args ?? null ) ? array_values( $event->args ) : array();

		$status = Scheduled_Updates::get_scheduled_update_status( $schedule_id );
		$status = is_array( $status ) ? $status : array();

		return array(
			'id'                 => $schedule_id,
			'plugins'            => array_map( 'strval', $plugins ),
			'schedule'           => array(
				'interval'  => $interval,
				'timestamp' => $timestamp,
				'next_run'  => $timestamp > 0 ? gmdate( 'Y-m-d H:i:s', $timestamp ) : null,
			),
			'last_run_status'    => isset( $status['last_run_status'] ) && is_string( $status['last_run_status'] )
				? $status['last_run_status']
				: null,
			'last_run_timestamp' => isset( $status['last_run_timestamp'] ) && is_numeric( $status['last_run_timestamp'] )
				? (int) $status['last_run_timestamp']
				: null,
			'active'             => (bool) Scheduled_Updates_Active::get( $schedule_id ),
		);
	}

	/**
	 * Sanitize/validate a plugin slug list.
	 *
	 * Returns the sorted list on success, a WP_Error on bad input. We don't
	 * verify installation here — the REST controller already enforces that
	 * during dispatch and produces a more accurate error.
	 *
	 * @param mixed $raw Raw input value.
	 * @return array<int, string>|WP_Error
	 */
	private static function sanitize_plugins( $raw ) {
		if ( ! is_array( $raw ) || empty( $raw ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'invalid_plugins',
				__( '`plugins` must be a non-empty array of plugin slugs.', 'jetpack-scheduled-updates' )
			);
		}

		$out = array();
		foreach ( $raw as $slug ) {
			if ( ! is_string( $slug ) || '' === $slug ) {
				return new WP_Error(
					self::ERROR_PREFIX . 'invalid_plugins',
					__( 'Each plugin slug must be a non-empty string.', 'jetpack-scheduled-updates' )
				);
			}
			$out[] = $slug;
		}

		// Match the REST controller, which sorts the plugins list before storing.
		sort( $out, SORT_NATURAL | SORT_FLAG_CASE );
		return $out;
	}

	/**
	 * Sanitize/validate a schedule object.
	 *
	 * @param mixed $raw Raw input value.
	 * @return array{interval: string, timestamp: int}|WP_Error
	 */
	private static function sanitize_schedule( $raw ) {
		if ( ! is_array( $raw ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'invalid_schedule',
				__( '`schedule` must be an object with `interval` and `timestamp`.', 'jetpack-scheduled-updates' )
			);
		}

		$interval = isset( $raw['interval'] ) && is_string( $raw['interval'] ) ? $raw['interval'] : '';
		if ( ! in_array( $interval, self::INTERVALS, true ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'invalid_schedule',
				sprintf(
					/* translators: %s: comma-separated list of valid interval values. */
					__( '`schedule.interval` must be one of: %s.', 'jetpack-scheduled-updates' ),
					implode( ', ', self::INTERVALS )
				)
			);
		}

		if ( ! isset( $raw['timestamp'] ) || ! is_numeric( $raw['timestamp'] ) || (int) $raw['timestamp'] <= 0 ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'invalid_schedule',
				__( '`schedule.timestamp` must be a positive Unix timestamp.', 'jetpack-scheduled-updates' )
			);
		}

		return array(
			'interval'  => $interval,
			'timestamp' => (int) $raw['timestamp'],
		);
	}

	/**
	 * Build a `WP_REST_Request` pre-populated with the given JSON body.
	 *
	 * @param string $method HTTP method.
	 * @param string $route  Route path.
	 * @param array  $body   Optional body params.
	 * @return \WP_REST_Request
	 */
	private static function make_rest_request( string $method, string $route, array $body = array() ): \WP_REST_Request {
		$request = new \WP_REST_Request( $method, $route );
		if ( ! empty( $body ) ) {
			$request->set_body_params( $body );
		}
		return $request;
	}

	/**
	 * Dispatch a request through the REST server and normalize the response
	 * into the abilities layer's `array|WP_Error` convention.
	 *
	 * Going through `rest_do_request()` (rather than calling the controller
	 * methods directly) reuses the full WPCOM update-schedules pipeline —
	 * permission check, schema validation, plugin-installation validation,
	 * sync option write — exactly as a public REST caller would. The
	 * Abilities API does not understand `WP_REST_Response`, so callers
	 * receive the unwrapped payload (or a WP_Error) directly.
	 *
	 * @param \WP_REST_Request $request The request.
	 * @return mixed|WP_Error
	 */
	private static function dispatch_request( \WP_REST_Request $request ) {
		$response = rest_do_request( $request );

		if ( $response->is_error() ) {
			return $response->as_error();
		}

		return $response->get_data();
	}

	/**
	 * Build a `not_found` WP_Error referencing the offending id.
	 *
	 * @param string $id Schedule id.
	 * @return WP_Error
	 */
	private static function not_found_error( string $id ): WP_Error {
		return new WP_Error(
			self::ERROR_PREFIX . 'not_found',
			sprintf(
				/* translators: %s: the schedule id that could not be found. */
				__( 'No scheduled-update job with id `%s` was found. Call jetpack-scheduled-updates/list-schedules first to discover valid ids.', 'jetpack-scheduled-updates' ),
				$id
			)
		);
	}
}
