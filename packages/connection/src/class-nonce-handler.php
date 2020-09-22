<?php
/**
 * The nonce handler.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * The nonce handler.
 */
class Nonce_Handler {

	/**
	 * How many nonces should be removed during each run of the runtime cleanup.
	 * Can be modified using the filter `jetpack_connection_nonce_cleanup_runtime_limit`.
	 */
	const CLEANUP_RUNTIME_LIMIT = 10;

	/**
	 * How many nonces should be removed per batch during the `clean_all()` run.
	 */
	const CLEAN_ALL_LIMIT_PER_BATCH = 1000;

	/**
	 * Nonce lifetime in seconds.
	 */
	const LIFETIME = HOUR_IN_SECONDS;

	/**
	 * The nonces used during the request are stored here to keep them valid.
	 *
	 * @var array
	 */
	private static $nonces_used_this_request = array();

	/**
	 * Adds a used nonce to a list of known nonces.
	 *
	 * @param int    $timestamp the current request timestamp.
	 * @param string $nonce the nonce value.
	 * @param bool   $run_cleanup Whether to run the `cleanup_runtime()`.
	 *
	 * @return bool whether the nonce is unique or not.
	 */
	public static function add( $timestamp, $nonce, $run_cleanup = true ) {
		global $wpdb;

		if ( isset( static::$nonces_used_this_request[ "$timestamp:$nonce" ] ) ) {
			return static::$nonces_used_this_request[ "$timestamp:$nonce" ];
		}

		// This should always have gone through Jetpack_Signature::sign_request() first to check $timestamp and $nonce.
		$timestamp = (int) $timestamp;
		$nonce     = esc_sql( $nonce );

		// Raw query so we can avoid races: add_option will also update.
		$show_errors = $wpdb->hide_errors();

		// Running try...finally to make sure.
		try {
			$old_nonce = $wpdb->get_row(
				$wpdb->prepare( "SELECT 1 FROM `$wpdb->options` WHERE option_name = %s", "jetpack_nonce_{$timestamp}_{$nonce}" )
			);

			if ( is_null( $old_nonce ) ) {
				$return = (bool) $wpdb->query(
					$wpdb->prepare(
						"INSERT INTO `$wpdb->options` (`option_name`, `option_value`, `autoload`) VALUES (%s, %s, %s)",
						"jetpack_nonce_{$timestamp}_{$nonce}",
						time(),
						'no'
					)
				);

				/**
				 * Use the filter to disable the nonce cleanup that happens at shutdown after adding a new nonce.
				 *
				 * @since 9.0.0
				 *
				 * @param int $limit How many old nonces to remove at shutdown.
				 */
				if ( apply_filters( 'jetpack_connection_add_nonce_cleanup', $run_cleanup ) ) {
					add_action( 'shutdown', array( __CLASS__, 'clean_runtime' ) );
				}
			} else {
				$return = false;
			}
		} finally {
			$wpdb->show_errors( $show_errors );
		}

		static::$nonces_used_this_request[ "$timestamp:$nonce" ] = $return;

		return $return;
	}

	/**
	 * Removing [almost] all the nonces.
	 * Capped at 20 seconds to avoid breaking the site.
	 *
	 * @param int $cutoff_timestamp All nonces added before this timestamp will be removed.
	 *
	 * @return true
	 */
	public static function clean_all( $cutoff_timestamp = PHP_INT_MAX ) {
		// phpcs:ignore Generic.CodeAnalysis.ForLoopWithTestFunctionCall.NotAllowed
		for ( $end_time = time() + 20; time() < $end_time; ) {
			$result = static::delete( static::CLEAN_ALL_LIMIT_PER_BATCH, $cutoff_timestamp );

			if ( ! $result ) {
				break;
			}
		}

		return true;
	}

	/**
	 * Clean up the expired nonces on shutdown.
	 *
	 * @return bool True if the cleanup query has been run, false if the table is locked.
	 */
	public static function clean_runtime() {
		// If the table is currently in use, we do nothing.
		// We don't really care if the cleanup is occasionally skipped,
		// as long as we can run the cleanup at least once every ten attempts.
		if ( static::is_table_locked() ) {
			return false;
		}

		/**
		 * Adjust the number of old nonces that are cleaned up at shutdown.
		 *
		 * @since 9.0.0
		 *
		 * @param int $limit How many old nonces to remove at shutdown.
		 */
		$limit = apply_filters( 'jetpack_connection_nonce_cleanup_runtime_limit', static::CLEANUP_RUNTIME_LIMIT );

		static::delete( $limit, time() - static::LIFETIME );

		return true;
	}


	/**
	 * Delete the nonces.
	 *
	 * @param int      $limit How many nonces to delete.
	 * @param null|int $cutoff_timestamp All nonces added before this timestamp will be removed.
	 *
	 * @return int|false Number of removed nonces, or `false` if nothing to remove (or in case of a database error).
	 */
	public static function delete( $limit = 10, $cutoff_timestamp = null ) {
		global $wpdb;

		$ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT option_id FROM `{$wpdb->options}`"
				. " WHERE `option_name` >= 'jetpack_nonce_' AND `option_name` < %s"
				. ' LIMIT %d',
				'jetpack_nonce_' . $cutoff_timestamp,
				$limit
			)
		);

		if ( ! is_array( $ids ) || ! count( $ids ) ) {
			// There's either nothing to remove, or there's an error and we can't proceed.
			return false;
		}

		$ids_fill = implode( ', ', array_fill( 0, count( $ids ), '%d' ) );

		// The Code Sniffer is unable to understand what's going on...
		// phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared,WordPress.DB.PreparedSQLPlaceholders.UnfinishedPrepare
		return $wpdb->query( $wpdb->prepare( "DELETE FROM `{$wpdb->options}` WHERE `option_id` IN ( {$ids_fill} )", $ids ) );
	}

	/**
	 * Clean the cached nonces valid during the current request, therefore making them invalid.
	 *
	 * @return bool
	 */
	public static function invalidate_request_nonces() {
		static::$nonces_used_this_request = array();

		return true;
	}

	/**
	 * Check if the options table is locked.
	 * Subject to race condition, the table may appear locked when a fast database query is performing.
	 *
	 * @return bool
	 */
	protected static function is_table_locked() {
		global $wpdb;

		$result = $wpdb->get_results( "SHOW OPEN TABLES WHERE In_use > 0 AND `Table` = '{$wpdb->options}'" );

		return is_array( $result ) && count( $result );
	}

}
