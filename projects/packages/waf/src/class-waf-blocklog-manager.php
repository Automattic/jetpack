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
	 * Create the log table when plugin is activated.
	 *
	 * @return void
	 */
	public static function create_blocklog_table() {
		global $wpdb;

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$sql = "
		CREATE TABLE {$wpdb->prefix}jetpack_waf_blocklog (
			log_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
			timestamp datetime NOT NULL,
			rule_id BIGINT NOT NULL,
			reason longtext NOT NULL,
			PRIMARY KEY (log_id),
			KEY timestamp (timestamp)
		)
		";

		dbDelta( $sql );
	}

	/**
	 * Connect to WordPress database.
	 */
	private function connect_to_wordpress_db() {
		if ( ! file_exists( JETPACK_WAF_WPCONFIG ) ) {
			return;
		}

		require_once JETPACK_WAF_WPCONFIG;
		$conn = new \mysqli( DB_HOST, DB_USER, DB_PASSWORD, DB_NAME ); // phpcs:ignore WordPress.DB.RestrictedClasses.mysql__mysqli

		if ( $conn->connect_error ) {
			error_log( 'Could not connect to the database:' . $conn->connect_error );
			return null;
		}

		return $conn;
	}

	/**
	 * Write block logs to database.
	 *
	 * @param array $log_data Log data.
	 */
	private function write_blocklog_row( $log_data ) {
		$conn = $this->connect_to_wordpress_db();

		if ( ! $conn ) {
			return;
		}

		global $table_prefix;

		$statement = $conn->prepare( "INSERT INTO {$table_prefix}jetpack_waf_blocklog(reason,rule_id, timestamp) VALUES (?, ?, ?)" );
		if ( false !== $statement ) {
			$statement->bind_param( 'sis', $log_data['reason'], $log_data['rule_id'], $log_data['timestamp'] );
			$statement->execute();

			if ( $conn->insert_id > 100 ) {
				$conn->query( "DELETE FROM {$table_prefix}jetpack_waf_blocklog ORDER BY log_id LIMIT 1" );
			}
		}
	}

	/**
	 * Update the daily summary stats for the current date.
	 *
	 * @return void
	 */
	public function update_daily_summary() {
		$stats = get_option( 'jetpack_waf_blocklog_daily_summary', array() );
		$date  = gmdate( 'Y-m-d' );

		if ( ! isset( $stats[ $date ] ) ) {
			$stats[ $date ] = 0;
		}

		++$stats[ $date ];

		// Prune stats to keep only the last 30 days.
		$stats = $this->prune_stats( $stats );

		update_option( 'jetpack_waf_blocklog_daily_summary', $stats );
	}

	/**
	 * Prune the stats to retain only data for the last 30 days.
	 *
	 * @param array $stats The array of stats to prune.
	 * @return array Pruned stats array.
	 */
	private function prune_stats( $stats ) {
		$pruned_stats  = array();
		$one_month_ago = gmdate( 'Y-m-d', strtotime( '-30 days' ) );

		foreach ( $stats as $date => $count ) {
			if ( $date >= $one_month_ago ) {
				$pruned_stats[ $date ] = $count;
			}
		}

		return $pruned_stats;
	}

	/**
	 * Get the total number of blocked requests for today.
	 *
	 * @return int
	 */
	public function get_today_stats() {
		$stats = get_option( 'jetpack_waf_blocklog_daily_summary', array() );
		$today = gmdate( 'Y-m-d' );

		return isset( $stats[ $today ] ) ? $stats[ $today ] : 0;
	}

	/**
	 * Get the total number of blocked requests for the current month.
	 *
	 * @return int
	 */
	public function get_current_month_stats() {
		$stats               = get_option( 'jetpack_waf_blocklog_daily_summary', array() );
		$current_month_start = gmdate( 'Y-m-01' );
		$total_blocks        = 0;

		foreach ( $stats as $date => $count ) {
			if ( $date >= $current_month_start ) {
				$total_blocks += $count;
			}
		}

		return $total_blocks;
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

		$this->write_blocklog_row( $log_data );
		$this->update_daily_summary();
	}
}
