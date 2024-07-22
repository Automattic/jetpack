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
	private static function connect_to_wordpress_db() {
		if ( ! file_exists( JETPACK_WAF_WPCONFIG ) ) {
			return;
		}

		require_once JETPACK_WAF_WPCONFIG;
		// @phan-suppress-next-line PhanUndeclaredConstant - These constants are defined in the wp-config file.
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
	 * Update the daily summary stats for the current date.
	 *
	 * @return void
	 */
	private static function update_daily_summary() {
		if ( ! ( defined( 'JETPACK_WAF_SHARE_DATA' ) && JETPACK_WAF_SHARE_DATA ) ) {
			return;
		}

		$option_name = 'jetpack_waf_blocklog_daily_summary';
		$date        = gmdate( 'Y-m-d' );

		if ( function_exists( 'get_option' ) && function_exists( 'update_option' ) ) {
			$stats = get_option( $option_name, array() );

			if ( ! isset( $stats[ $date ] ) ) {
				$stats[ $date ] = 0;
			}
			++$stats[ $date ];

			// Prune stats to keep only the last 30 days.
			$stats = self::prune_stats( $stats );

			update_option( $option_name, $stats );
		} else {
			$conn = self::connect_to_wordpress_db();
			if ( ! $conn ) {
				return;
			}

			global $table_prefix;

			// Fetch the current stats
			$result = $conn->query(
				sprintf(
					"SELECT option_value FROM %soptions WHERE option_name = '%s'",
					$conn->real_escape_string( $table_prefix ),
					$conn->real_escape_string( $option_name )
				)
			);

			$stats = array();
			if ( $result ) {
				$row   = $result->fetch_assoc();
				$stats = $row ? unserialize( $row['option_value'] ) : array();
				$result->free();
			}

			// Increment today's stats or initialize them
			if ( ! isset( $stats[ $date ] ) ) {
				$stats[ $date ] = 0;
			}
			++$stats[ $date ];

			// Prune stats to keep only the last 30 days
			$stats = self::prune_stats( $stats );

			// Update the option in the database
			$updated_value = serialize( $stats );
			$conn->query(
				sprintf(
					"INSERT INTO %soptions (option_name, option_value) VALUES ('%s', '%s') ON DUPLICATE KEY UPDATE option_value = '%s'",
					$conn->real_escape_string( $table_prefix ),
					$conn->real_escape_string( $option_name ),
					$conn->real_escape_string( $updated_value ),
					$conn->real_escape_string( $updated_value )
				)
			);
		}
	}

	/**
	 * Prune the stats to retain only data for the last 30 days.
	 *
	 * @param array $stats The array of stats to prune.
	 * @return array Pruned stats array.
	 */
	private static function prune_stats( $stats ) {
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
	public static function get_today_stats() {
		$stats = get_option( 'jetpack_waf_blocklog_daily_summary', array() );
		$today = gmdate( 'Y-m-d' );

		return $stats[ $today ] ?? 0;
	}

	/**
	 * Get the total number of blocked requests for the current month.
	 *
	 * @return int
	 */
	public static function get_current_month_stats() {
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
	 * Get the headers for logging purposes.
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

		self::write_blocklog_row( $log_data );
		self::update_daily_summary();
	}

	/**
	 * Gets the path to the waf-blocklog file.
	 *
	 * @return string The waf-blocklog file path.
	 */
	public static function get_blocklog_file_path() {
		return trailingslashit( JETPACK_WAF_DIR ) . 'waf-blocklog';
	}
}
