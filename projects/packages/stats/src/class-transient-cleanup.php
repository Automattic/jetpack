<?php
/**
 * Stats Transient Cleanup
 *
 * Handles cleanup of expired stats cache transients to prevent database bloat
 * on sites without a persistent object cache.
 *
 * Adapted from Brute Force Protection transient cleanup.
 *
 * @package automattic/jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

/**
 * Transient_Cleanup class.
 *
 * Provides a scheduled cron job to clean up expired stats transients.
 * WordPress transient garbage collection is "lazy" - expired transients are only
 * deleted when accessed via get_transient(). Stats transients use dynamic cache keys
 * based on query parameters, so expired entries are rarely accessed again and
 * accumulate indefinitely in wp_options on sites without an external object cache.
 *
 * @since 0.18.0
 */
class Transient_Cleanup {

	/**
	 * Cron hook name.
	 */
	const CRON_HOOK = 'jetpack_stats_transient_cleanup';

	/**
	 * Batch size for transient cleanup.
	 *
	 * Used as the SQL LIMIT per prefix and as the threshold for stopping iteration.
	 * Actual deletions per run may slightly exceed this when processing multiple prefixes.
	 */
	const BATCH_SIZE = 5000;

	/**
	 * Cron interval in seconds (8 hours).
	 */
	const CRON_INTERVAL = 28800;

	/**
	 * Initialize the transient cleanup.
	 *
	 * @return void
	 */
	public static function init() {
		// Register the cron hook.
		add_action( self::CRON_HOOK, array( static::class, 'run_cleanup' ) );

		// Register custom cron schedule.
		// phpcs:ignore WordPress.WP.CronInterval.ChangeDetected -- 8 hours is intentional for batched transient cleanup.
		add_filter( 'cron_schedules', array( static::class, 'add_cron_schedule' ) );

		// Schedule the cron job if not already scheduled.
		add_action( 'admin_init', array( static::class, 'schedule_cleanup' ) );
	}

	/**
	 * Add custom cron schedule for 8-hour intervals.
	 *
	 * @param array $schedules Existing cron schedules.
	 * @return array Modified cron schedules.
	 */
	public static function add_cron_schedule( $schedules ) {
		if ( ! isset( $schedules['jetpack_stats_eight_hours'] ) ) {
			$schedules['jetpack_stats_eight_hours'] = array(
				'interval' => self::CRON_INTERVAL,
				'display'  => __( 'Every Eight Hours', 'jetpack-stats' ),
			);
		}
		return $schedules;
	}

	/**
	 * Schedule the cleanup cron job.
	 *
	 * Skips scheduling on sites with persistent object cache since transients
	 * auto-expire there and cleanup is unnecessary.
	 *
	 * @return void
	 */
	public static function schedule_cleanup() {
		// Skip scheduling on sites with persistent object cache - not needed there.
		if ( wp_using_ext_object_cache() ) {
			// Unschedule if it was previously scheduled (e.g., object cache was added later).
			if ( wp_next_scheduled( self::CRON_HOOK ) ) {
				wp_clear_scheduled_hook( self::CRON_HOOK );
			}
			return;
		}

		if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_event( time() + self::CRON_INTERVAL, 'jetpack_stats_eight_hours', self::CRON_HOOK );
		}
	}

	/**
	 * Unschedule the cleanup cron job.
	 * Hooked to 'jetpack_deactivate_module_stats' in Main::__construct().
	 *
	 * @return void
	 */
	public static function unschedule_cleanup() {
		wp_clear_scheduled_hook( self::CRON_HOOK );
	}

	/**
	 * Get the list of transient prefixes to clean up.
	 *
	 * @return array List of transient prefixes.
	 */
	public static function get_transient_prefixes() {
		$prefixes = array(
			WPCOM_Stats::STATS_CACHE_TRANSIENT_PREFIX, // jetpack_restapi_stats_cache_
		);

		/**
		 * Filter the list of transient prefixes to clean up.
		 *
		 * @since 0.18.0
		 *
		 * @param array $prefixes List of transient prefixes.
		 */
		$filtered = apply_filters( 'jetpack_stats_transient_cleanup_prefixes', $prefixes );

		// Normalize filtered value: ensure array, filter to non-empty strings, dedupe.
		if ( ! is_array( $filtered ) ) {
			$filtered = $prefixes;
		}

		$filtered = array_filter(
			$filtered,
			function ( $prefix ) {
				return is_string( $prefix ) && '' !== $prefix;
			}
		);

		return array_unique( $filtered );
	}

	/**
	 * Run the transient cleanup.
	 *
	 * @return int|false Number of deleted transient options (two entries per transient), or false if skipped.
	 */
	public static function run_cleanup() {
		/**
		 * Filter to disable transient cleanup.
		 *
		 * @since 0.18.0
		 *
		 * @param bool $disabled Whether to disable transient cleanup. Default false.
		 */
		if ( apply_filters( 'jetpack_stats_transient_cleanup_disabled', false ) ) {
			return false;
		}

		// Skip if using external object cache - transients auto-expire there.
		if ( wp_using_ext_object_cache() ) {
			return false;
		}

		$total_deleted = 0;
		$prefixes      = self::get_transient_prefixes();

		foreach ( $prefixes as $prefix ) {
			$deleted        = self::purge_expired_transients( $prefix );
			$total_deleted += $deleted;

			// Stop processing additional prefixes once we've reached the batch threshold.
			// Note: total may exceed BATCH_SIZE since each prefix can delete up to BATCH_SIZE.
			if ( $total_deleted >= self::BATCH_SIZE ) {
				break;
			}
		}

		return $total_deleted;
	}

	/**
	 * Purge expired transients for a specific prefix.
	 *
	 * @param string $prefix The transient prefix to clean up.
	 * @return int Number of deleted transient options, two entries for each transient.
	 */
	private static function purge_expired_transients( $prefix ) {
		global $wpdb;

		$now            = time();
		$timeout_prefix = '_transient_timeout_' . $prefix;
		$like_pattern   = $wpdb->esc_like( $timeout_prefix ) . '%';

		// Find expired transients by querying timeout entries.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$transients = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT SUBSTRING(option_name, %d) AS transient_name FROM {$wpdb->options} WHERE option_name LIKE %s AND option_value < %d LIMIT %d",
				strlen( $timeout_prefix ) + 1,
				$like_pattern,
				$now,
				self::BATCH_SIZE
			)
		);

		if ( empty( $transients ) ) {
			return 0;
		}

		// Build list of option names to delete (both transient and timeout entries).
		$option_names = array();
		foreach ( $transients as $transient ) {
			$option_names[] = '_transient_' . $prefix . $transient;
			$option_names[] = '_transient_timeout_' . $prefix . $transient;
		}

		// Delete in chunks to avoid excessively long SQL queries.
		// Each option name can be ~80 chars, so 50 items ≈ 4KB per query.
		$chunks        = array_chunk( $option_names, 50 );
		$total_deleted = 0;

		foreach ( $chunks as $chunk ) {
			$placeholders = implode( ', ', array_fill( 0, count( $chunk ), '%s' ) );

			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$result = $wpdb->query(
				$wpdb->prepare(
					"DELETE FROM {$wpdb->options} WHERE option_name IN ($placeholders)", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare -- $placeholders is a list of %s.
					$chunk
				)
			);

			if ( false !== $result ) {
				$total_deleted += $result;
			}
		}

		return $total_deleted;
	}
}
