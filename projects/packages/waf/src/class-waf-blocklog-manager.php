<?php
/**
 * Blocklog manager for the WAF
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

/**
 * Class used to manage blocklog operations
 */
class Waf_Blocklog_Manager {
	/**
	 * Create the blocklog table
	 *
	 * @return void
	 */
	public function create_blocklog_table() {
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		global $wpdb;

		$summary_sql = "
			CREATE TABLE {$wpdb->prefix}jetpack_waf_blocklog_daily_summary (
				summary_date DATE NOT NULL,
				total_blocks INT UNSIGNED NOT NULL DEFAULT 0,
				PRIMARY KEY (summary_date)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
		";

		dbDelta( $summary_sql );
	}

	/**
	 * Update the daily summary table for the current date
	 *
	 * @return void
	 */
	public function update_daily_summary() {
		global $wpdb;

		$table_name = $wpdb->prefix . 'jetpack_waf_blocklog_daily_summary';
		$date       = gmdate( 'Y-m-d' );

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared
		$sql = $wpdb->prepare(
			"INSERT INTO {$table_name} (summary_date, total_blocks) VALUES (%s, 1)
			 ON DUPLICATE KEY UPDATE total_blocks = total_blocks + 1",
			$date
		);

		$wpdb->query( $sql );
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared

		// Migrate the old blocklog table to the new daily summary table
		$this->migrate_jetpack_waf_blocklog();

		// After updating the daily summary, prune entries older than 1 month.
		$this->prune_daily_summary_table();
	}

	/**
	 * Prune the daily summary table to retain only 1 month of data
	 *
	 * @return void
	 */
	private function prune_daily_summary_table() {
		global $wpdb;
		$waf_blocklog_daily_summary = $wpdb->prefix . 'jetpack_waf_blocklog_daily_summary';

		// Calculate the date 1 month ago from today
		$one_month_ago = gmdate( 'Y-m-d', strtotime( '-1 month' ) );

		// Delete entries older than 1 month
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM $waf_blocklog_daily_summary WHERE summary_date < %s",
				$one_month_ago
			)
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
	}

	/**
	 * Get the total number of blocked requests for today
	 *
	 * @return int
	 */
	public function get_today_stats() {
		global $wpdb;
		$table_name = $wpdb->prefix . 'jetpack_waf_blocklog_daily_summary';

		// Calculate today's date
		$today = current_time( 'Y-m-d' );

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$total_blocks = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT total_blocks FROM $table_name WHERE summary_date = %s",
				$today
			)
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared


		return $total_blocks ? $total_blocks : 0;
	}

	/**
	 * Get the total number of blocked requests for the current month
	 *
	 * @return int
	 */
	public function get_current_month_stats() {
		global $wpdb;
		$table_name = $wpdb->prefix . 'jetpack_waf_blocklog_daily_summary';

		// Calculate the first day of the current month in YYYY-MM-DD format
		$current_month_start = gmdate( 'Y-m-01' );

		// Calculate the first day of the next month, to set the range of this month
		$next_month_start = gmdate( 'Y-m-01', strtotime( '+1 month' ) );

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$total_blocks = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT SUM(total_blocks) FROM $table_name 
			 WHERE summary_date >= %s AND summary_date < %s",
				$current_month_start,
				$next_month_start
			)
		);
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared

		return $total_blocks ? $total_blocks : 0;
	}

	/**
	 * Migrate the old blocklog table to the new daily summary table
	 *
	 * @return void
	 */
	public function migrate_jetpack_waf_blocklog() {
		global $wpdb;
		$waf_blocklog               = $wpdb->prefix . 'jetpack_waf_blocklog';
		$waf_blocklog_daily_summary = $wpdb->prefix . 'jetpack_waf_blocklog_daily_summary';

		// Check if the old table exists
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		if ( $wpdb->get_var( "SHOW TABLES LIKE '{$waf_blocklog}'" ) === $waf_blocklog ) {
			// Aggregate data from the old table to the daily summary table
			$results = $wpdb->get_results(
				"SELECT DATE(timestamp) AS summary_date, COUNT(*) AS total_blocks
				FROM {$waf_blocklog}
				GROUP BY DATE(timestamp)"
			);

			foreach ( $results as $row ) {
				// Insert or update the summary data for each day
				$wpdb->query(
					$wpdb->prepare(
						"INSERT INTO {$waf_blocklog_daily_summary} (summary_date, total_blocks) VALUES (%s, %d)
						ON DUPLICATE KEY UPDATE total_blocks = total_blocks + VALUES(total_blocks)",
						$row->summary_date,
						$row->total_blocks
					)
				);
			}
			// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.InterpolatedNotPrepared

			// Remove the old table
			// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.PreparedSQL.InterpolatedNotPrepared
			$wpdb->query( "DROP TABLE IF EXISTS {$waf_blocklog}" );
		}
	}

	/**
	 * Write a blocklog entry
	 *
	 * @param int    $rule_id The rule ID that triggered the block.
	 * @param string $reason  The reason for the block.
	 *
	 * @return void
	 */
	public function write_blocklog( $rule_id, $reason ) {
		$log_data              = array();
		$log_data['rule_id']   = $rule_id;
		$log_data['reason']    = $reason;
		$log_data['timestamp'] = gmdate( 'Y-m-d H:i:s' );

		if ( defined( 'JETPACK_WAF_SHARE_DATA' ) && JETPACK_WAF_SHARE_DATA ) {
			$file_path   = JETPACK_WAF_DIR . '/waf-blocklog';
			$file_exists = file_exists( $file_path );

			if ( ! $file_exists || filesize( $file_path ) < ( 100 * 1024 * 1024 ) ) {
				$fp = fopen( $file_path, 'a+' );

				if ( $fp ) {
					try {
						fwrite( $fp, json_encode( $log_data ) . "\n" );
					} finally {
						fclose( $fp );
					}
				}
			}
		}

		$this->update_daily_summary();
	}
}
