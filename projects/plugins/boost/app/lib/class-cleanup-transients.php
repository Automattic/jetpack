<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack\Boost_Core\Lib\Transient;

/**
 * Deletes expired Boost options without caching every live payload in the request.
 *
 * @since $$next-version$$
 */
class Cleanup_Transients {

	const FOLLOWUP_HOOK = 'jetpack_boost_general_cleanup_followup';

	// Larger than the stored-paths batch so a large backlog clears in few runs; rows are small.
	private const BATCH_SIZE    = 1000;
	private const CURSOR_OPTION = 'jetpack_boost_general_cleanup_last_processed_option_id';

	/**
	 * Processes one batch and schedules the rest of the pass.
	 *
	 * @return void
	 */
	public static function run_cleanup() {
		global $wpdb;

		$cursor = (int) get_option( self::CURSOR_OPTION, 0 );
		$rows   = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
			$wpdb->prepare(
				"SELECT option_id, option_name, option_value FROM {$wpdb->options}
				WHERE option_name LIKE %s AND option_id > %d
				ORDER BY option_id ASC LIMIT %d",
				$wpdb->esc_like( Transient::OPTION_PREFIX ) . '%',
				$cursor,
				self::BATCH_SIZE + 1
			),
			ARRAY_A
		);

		if ( $wpdb->last_error || ! is_array( $rows ) ) {
			return;
		}

		$has_more = count( $rows ) > self::BATCH_SIZE;
		if ( $has_more ) {
			array_pop( $rows );
		}

		$now = time();
		foreach ( $rows as $row ) {
			if ( ! self::is_expired( $row['option_value'], $now ) ) {
				continue;
			}

			// A render may have renewed this option since the batch was read.
			$current_value = $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
				$wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_id = %d", (int) $row['option_id'] )
			);
			if ( $wpdb->last_error ) {
				return;
			}
			if ( self::is_expired( $current_value, $now ) ) {
				delete_option( $row['option_name'] );
			}
		}

		if ( ! $has_more ) {
			delete_option( self::CURSOR_OPTION );
			return;
		}

		$last_row = end( $rows );
		update_option( self::CURSOR_OPTION, (int) $last_row['option_id'], false );

		if ( false === wp_next_scheduled( self::FOLLOWUP_HOOK ) ) {
			wp_schedule_single_event( time(), self::FOLLOWUP_HOOK );
		}
	}

	/**
	 * Treats nonnumeric expiry values as unexpired.
	 *
	 * @param mixed $raw_value Stored option value.
	 * @param int   $now Current timestamp.
	 * @return bool Whether the expiry is numeric and in the past.
	 */
	private static function is_expired( $raw_value, $now ) {
		$value = maybe_unserialize( $raw_value );
		return is_array( $value ) && isset( $value['expire'] ) && is_numeric( $value['expire'] ) && $value['expire'] < $now;
	}
}
