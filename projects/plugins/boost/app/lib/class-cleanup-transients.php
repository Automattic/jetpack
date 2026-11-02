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

		if ( ! is_array( $rows ) ) {
			return;
		}

		$has_more = count( $rows ) > self::BATCH_SIZE;
		if ( $has_more ) {
			array_pop( $rows );
		}

		$now = time();
		foreach ( $rows as $row ) {
			$value = maybe_unserialize( $row['option_value'] );
			if ( is_array( $value ) && isset( $value['expire'] ) && $value['expire'] < $now ) {
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
}
