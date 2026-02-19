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
 * @since $$next-version$$
 */
class Transient_Cleanup {

	/**
	 * Cron hook name.
	 */
	const CRON_HOOK = 'jetpack_stats_transient_cleanup';

	/**
	 * Lock transient name to prevent concurrent runs.
	 */
	const LOCK_TRANSIENT = 'jetpack_stats_cleanup_lock';

	/**
	 * Lock timeout in seconds (5 minutes).
	 */
	const LOCK_TIMEOUT = 300;

	/**
	 * Maximum number of transients to delete per run.
	 */
	const BATCH_SIZE = 100;

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
	 * @return void
	 */
	public static function schedule_cleanup() {
		if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_event( time() + self::CRON_INTERVAL, 'jetpack_stats_eight_hours', self::CRON_HOOK );
		}
	}

	/**
	 * Unschedule the cleanup cron job.
	 * Should be called on plugin deactivation.
	 *
	 * @return void
	 */
	public static function unschedule_cleanup() {
		$timestamp = wp_next_scheduled( self::CRON_HOOK );
		if ( $timestamp ) {
			wp_unschedule_event( $timestamp, self::CRON_HOOK );
		}
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
		 * @since $$next-version$$
		 *
		 * @param array $prefixes List of transient prefixes.
		 */
		return apply_filters( 'jetpack_stats_transient_cleanup_prefixes', $prefixes );
	}

	/**
	 * Run the transient cleanup.
	 *
	 * @return int|false Number of deleted transients, or false if skipped.
	 */
	public static function run_cleanup() {
		/**
		 * Filter to disable transient cleanup.
		 *
		 * @since $$next-version$$
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

		// Acquire lock to prevent concurrent runs.
		if ( get_transient( self::LOCK_TRANSIENT ) ) {
			return false;
		}

		// Set lock.
		set_transient( self::LOCK_TRANSIENT, 1, self::LOCK_TIMEOUT );

		$total_deleted = 0;
		$prefixes      = self::get_transient_prefixes();

		foreach ( $prefixes as $prefix ) {
			$deleted        = self::purge_expired_transients( $prefix );
			$total_deleted += $deleted;

			// Stop if we've hit the batch limit.
			if ( $total_deleted >= self::BATCH_SIZE ) {
				break;
			}
		}

		// Release lock.
		delete_transient( self::LOCK_TRANSIENT );

		return $total_deleted;
	}

	/**
	 * Purge expired transients for a specific prefix.
	 *
	 * @param string $prefix The transient prefix to clean up.
	 * @return int Number of deleted transients.
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
		$options_names = array();
		foreach ( $transients as $transient ) {
			$options_names[] = '_transient_' . $prefix . $transient;
			$options_names[] = '_transient_timeout_' . $prefix . $transient;
		}

		// Delete all in a single query.
		$placeholders = implode( ', ', array_fill( 0, count( $options_names ), '%s' ) );

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
		$result = $wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->options} WHERE option_name IN ($placeholders)", // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare -- $placeholders is a list of %s.
				$options_names
			)
		);

		if ( false === $result ) {
			return 0;
		}

		return count( $transients );
	}
}
