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
	 * Gets the path to the waf-blocklog file.
	 *
	 * @return string The waf-blocklog file path.
	 */
	public static function get_blocklog_file_path() {
		return trailingslashit( JETPACK_WAF_DIR ) . 'waf-blocklog';
	}

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
	 * Close the database connection.
	 *
	 * @return void
	 */
	private static function close_db_connection() {
		if ( self::$db_connection ) {
			self::$db_connection->close();
			self::$db_connection = null;
		}
	}

	/**
	 * Serialize a value for storage in a WordPress option.
	 *
	 * @param mixed $value The value to serialize.
	 * @return string The serialized value.
	 */
	private static function serialize_option_value( $value ) {
		return serialize( $value );
	}

	/**
	 * Unserialize a value from a WordPress option.
	 *
	 * @param string $value The serialized value.
	 * @return mixed The unserialized value.
	 */
	private static function unserialize_option_value( string $value ) {
		return unserialize( $value );
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
	 * Write block logs to database.
	 *
	 * @param array $log_data Log data.
	 *
	 * @return void
	 */
	private static function write_blocklog_row( $log_data ) {
		$conn = self::connect_to_wordpress_db();

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
	 * Get the daily summary stats from the database.
	 *
	 * @return array The daily summary stats.
	 */
	private static function get_daily_summary() {
		global $table_prefix;
		$db_connection = self::connect_to_wordpress_db();
		if ( ! $db_connection ) {
			return array();
		}

		$result = $db_connection->query( "SELECT option_value FROM {$table_prefix}options WHERE option_name = '" . self::BLOCKLOG_OPTION_NAME_DAILY_SUMMARY . "'" );
		if ( ! $result ) {
			return array();
		}

		$row = $result->fetch_assoc();
		if ( ! $row ) {
			return array();
		}

		$daily_summary = self::unserialize_option_value( $row['option_value'] );
		$result->free();

		return is_array( $daily_summary ) ? $daily_summary : array();
	}

	/**
	 * Increments the current date's daily summary stat.
	 *
	 * @param array $current_value The current value of the daily summary.
	 *
	 * @return array The updated daily summary.
	 */
	public static function increment_daily_summary( array $current_value ) {
		$date                   = gmdate( 'Y-m-d' );
		$value                  = intval( $current_value[ $date ] ?? 0 );
		$current_value[ $date ] = $value + 1;

		return $current_value;
	}

	/**
	 * Update the daily summary option in the database.
	 *
	 * @param array $value The value to update.
	 *
	 * @return void
	 */
	private static function write_daily_summary_row( array $value ) {
		global $table_prefix;
		$option_name = self::BLOCKLOG_OPTION_NAME_DAILY_SUMMARY;

		$db_connection = self::connect_to_wordpress_db();
		if ( ! $db_connection ) {
			return;
		}

		$updated_value = self::serialize_option_value( $value );

		$statement = $db_connection->prepare( "INSERT INTO {$table_prefix}options (option_name, option_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE option_value = ?" );
		if ( false !== $statement ) {
			$statement->bind_param( 'sss', $option_name, $updated_value, $updated_value );
			$statement->execute();
		}
	}

	/**
	 * Update the daily summary stats for the current date.
	 *
	 * @return void
	 */
	private static function write_daily_summary() {
		$stats = self::get_daily_summary();
		$stats = self::increment_daily_summary( $stats );
		$stats = self::filter_last_30_days( $stats );

		self::write_daily_summary_row( $stats );
	}

	/**
	 * Get the all-time block count value from the database.
	 *
	 * @return int The all-time block count.
	 */
	private static function get_all_time_block_count_value() {
		global $table_prefix;
		$db_connection = self::connect_to_wordpress_db();
		if ( ! $db_connection ) {
			return 0;
		}

		$result = $db_connection->query( "SELECT option_value FROM {$table_prefix}options WHERE option_name = '" . self::BLOCKLOG_OPTION_NAME_ALL_TIME_BLOCK_COUNT . "'" );
		if ( ! $result ) {
			return 0;
		}

		$row = $result->fetch_assoc();
		if ( ! $row ) {
			return 0;
		}

		$all_time_block_count = intval( $row['option_value'] );
		$result->free();

		return $all_time_block_count;
	}

	/**
	 * Update the all-time block count value in the database.
	 *
	 * @param int $value The value to update.
	 * @return void
	 */
	private static function write_all_time_block_count_row( int $value ) {
		global $table_prefix;
		$option_name = self::BLOCKLOG_OPTION_NAME_ALL_TIME_BLOCK_COUNT;

		$db_connection = self::connect_to_wordpress_db();
		if ( ! $db_connection ) {
			return;
		}

		$statement = $db_connection->prepare( "INSERT INTO {$table_prefix}options (option_name, option_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE option_value = ?" );
		if ( false !== $statement ) {
			$statement->bind_param( 'sii', $option_name, $value, $value );
			$statement->execute();
		}
	}

	/**
	 * Increment the all-time stats.
	 *
	 * @return void
	 */
	private static function write_all_time_block_count() {
		$block_count = self::get_all_time_block_count_value();
		if ( ! $block_count ) {
			$block_count = self::get_default_all_time_stat_value();
		}

		self::write_all_time_block_count_row( $block_count + 1 );
	}

	/**
	 * Filters the stats to retain only data for the last 30 days.
	 *
	 * @param array $stats The array of stats to prune.
	 *
	 * @return array Pruned stats array.
	 */
	public static function filter_last_30_days( array $stats ) {
		$today         = gmdate( 'Y-m-d' );
		$one_month_ago = gmdate( 'Y-m-d', strtotime( '-30 days' ) );

		return array_filter(
			$stats,
			function ( $date ) use ( $one_month_ago, $today ) {
				return $date >= $one_month_ago && $date <= $today;
			},
			ARRAY_FILTER_USE_KEY
		);
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

	/**
	 * Get the headers for logging purposes.
	 *
	 * @return array The headers.
	 */
	public static function get_request_headers() {
		$all_headers     = getallheaders();
		$exclude_headers = array( 'Authorization', 'Cookie', 'Proxy-Authorization', 'Set-Cookie' );

		foreach ( $exclude_headers as $header ) {
			unset( $all_headers[ $header ] );
		}

		return $all_headers;
	}

	/**
	 * Write block logs. We won't write to the file if it exceeds 100 mb.
	 *
	 * @param string $rule_id The rule ID that triggered the block.
	 * @param string $reason  The reason for the block.
	 *
	 * @return void
	 */
	public static function write_blocklog( $rule_id, $reason ) {
		$log_data                 = array();
		$log_data['rule_id']      = $rule_id;
		$log_data['reason']       = $reason;
		$log_data['timestamp']    = gmdate( 'Y-m-d H:i:s' );
		$log_data['request_uri']  = isset( $_SERVER['REQUEST_URI'] ) ? \stripslashes( $_SERVER['REQUEST_URI'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$log_data['user_agent']   = isset( $_SERVER['HTTP_USER_AGENT'] ) ? \stripslashes( $_SERVER['HTTP_USER_AGENT'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$log_data['referer']      = isset( $_SERVER['HTTP_REFERER'] ) ? \stripslashes( $_SERVER['HTTP_REFERER'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$log_data['content_type'] = isset( $_SERVER['CONTENT_TYPE'] ) ? \stripslashes( $_SERVER['CONTENT_TYPE'] ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$log_data['get_params']   = json_encode( $_GET );

		if ( defined( 'JETPACK_WAF_SHARE_DEBUG_DATA' ) && JETPACK_WAF_SHARE_DEBUG_DATA ) {
			$log_data['post_params'] = json_encode( $_POST );
			$log_data['headers']     = self::get_request_headers();
		}

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

		self::write_daily_summary();
		self::write_all_time_block_count();
		self::write_blocklog_row( $log_data );
		self::close_db_connection();
	}
}
