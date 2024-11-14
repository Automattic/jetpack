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

	const BLOCKLOG_OPTION_NAME_DAILY_SUMMARY        = 'jetpack_waf_blocklog_daily_summary';
	const BLOCKLOG_OPTION_NAME_ALL_TIME_BLOCK_COUNT = 'jetpack_waf_all_time_block_count';

	/**
	 * Database connection.
	 *
	 * @var \mysqli|null
	 */
	private static $db_connection = null;

	/**
	 * Connect to WordPress database.
	 *
	 * @return \mysqli|null
	 */
	private static function connect_to_wordpress_db() {
		if ( self::$db_connection !== null ) {
			return self::$db_connection;
		}

		if ( ! file_exists( JETPACK_WAF_WPCONFIG ) ) {
			return null;
		}

		require_once JETPACK_WAF_WPCONFIG;
		// @phan-suppress-next-line PhanUndeclaredConstant - These constants are defined in the wp-config file.
		$conn = new \mysqli( DB_HOST, DB_USER, DB_PASSWORD, DB_NAME ); // phpcs:ignore WordPress.DB.RestrictedClasses.mysql__mysqli

		if ( $conn->connect_error ) {
			error_log( 'Could not connect to the database:' . $conn->connect_error );
			return null;
		}

		self::$db_connection = $conn;
		return self::$db_connection;
	}

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
	 * Get the total number of blocked requests for today.
	 *
	 * @return int
	 */
	public static function get_current_day_block_count() {
		$stats = get_option( self::BLOCKLOG_OPTION_NAME_DAILY_SUMMARY, array() );
		$today = gmdate( 'Y-m-d' );

		return $stats[ $today ] ?? 0;
	}

	/**
	 * Get the total number of blocked requests for last thirty days.
	 *
	 * @return int
	 */
	public static function get_thirty_days_block_counts() {
		$stats        = get_option( self::BLOCKLOG_OPTION_NAME_DAILY_SUMMARY, array() );
		$total_blocks = 0;

		foreach ( $stats as $count ) {
			$total_blocks += intval( $count );
		}

		return $total_blocks;
	}

	/**
	 * Get the total number of blocked requests for all time.
	 *
	 * @return int
	 */
	public static function get_all_time_block_count() {
		$all_time_block_count = get_option( self::BLOCKLOG_OPTION_NAME_ALL_TIME_BLOCK_COUNT, false );

		if ( false !== $all_time_block_count ) {
			return intval( $all_time_block_count );
		}

		return self::get_default_all_time_stat_value();
	}

	/**
	 * Compute the initial all-time stats value.
	 *
	 * @return int The initial all-time stats value.
	 */
	private static function get_default_all_time_stat_value() {
		$conn = self::connect_to_wordpress_db();
		if ( ! $conn ) {
			return 0;
		}

		global $table_prefix;

		$last_log_id_result = $conn->query( "SELECT log_id FROM {$table_prefix}jetpack_waf_blocklog ORDER BY log_id DESC LIMIT 1" );

		$all_time_block_count = 0;

		if ( $last_log_id_result && $last_log_id_result->num_rows > 0 ) {
			$row = $last_log_id_result->fetch_assoc();
			if ( $row !== null && isset( $row['log_id'] ) ) {
				$all_time_block_count = $row['log_id'];
			}
		}

		return intval( $all_time_block_count );
	}
}
