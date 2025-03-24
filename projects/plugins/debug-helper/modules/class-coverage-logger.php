<?php
/**
 * The Coverage Logger file contains the class `Coverage_Logger` that logs coverage data.
 *
 * @package automattic/jetpack-debug-helper
 */

namespace Automattic\Jetpack\Debug_Helper;

/**
 * Class Coverage_Logger
 *
 * Handles logging of coverage data that Jetpack plugins generate.
 *
 * @package Automattic\Jetpack\Debug_Helper
 */
class Coverage_Logger {

	const RUNTIME_TABLE_NAME = 'jetpack_runtime_coverage_data';

	/**
	 * XMLRPC_Logger constructor.
	 * Hooks the XML-RPC logging function into WordPress's init action.
	 */
	public function __construct() {
		if ( function_exists( 'xdebug_start_code_coverage' ) ) {
			$this->maybe_upsert_database();

			xdebug_start_code_coverage();
			add_action( 'shutdown', array( $this, 'log_coverage_results' ), 100000 );
		}
	}

	/**
	 * Saves coverage results into a file.
	 */
	public function log_coverage_results() {
		global $wpdb;

		$coverage_data = xdebug_get_code_coverage();

		$sql = sprintf( 'INSERT IGNORE INTO `%s` (path, line) VALUES ', $wpdb->prefix . self::RUNTIME_TABLE_NAME );

		foreach ( $coverage_data as $file => $lines ) {
			$path = substr( $file, strlen( ABSPATH ) );

			if ( ! str_starts_with( $path, 'wp-content/plugins/jetpack' ) ) {
				continue;
			}

			if ( false !== strpos( $path, '/vendor/' ) ) {
				continue;
			}

			$path = substr( $path, strlen( 'wp-content/plugins/' ) );

			$vendor_pos = strpos( $path, 'jetpack_vendor' );
			if ( false !== $vendor_pos ) {
				$path = substr( $path, $vendor_pos + strlen( 'jetpack_vendor/automattic/' ) );
			}

			foreach ( $lines as $line => $count ) {
				for ( $i = 0; $i < $count; $i++ ) {
					$sql .= $wpdb->prepare( '( %s, %d ),', $path, $line );
				}
			}
		}

		$wpdb->query( rtrim( $sql, ',' ) ); // phpcs:ignore WordPress.DB -- We are preparing the query before this.
	}

	/**
	 * Uses the dbDelta function to either update, create, or leave the existing
	 * database in peace.
	 */
	protected function maybe_upsert_database() {
		global $wpdb;

		$charset_collate = $wpdb->get_charset_collate();
		$table_name      = $wpdb->prefix . self::RUNTIME_TABLE_NAME;

		$sql = array(
			"CREATE TABLE $table_name (
  id mediumint(9) NOT NULL AUTO_INCREMENT,
  path varchar(255),
  line int,
  PRIMARY KEY (id),
  UNIQUE KEY `unique_path` (path, line)
) $charset_collate;",
		);

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
	}

	/**
	 * Returns an SQL string for getting the coverage diff results.
	 */
	protected function get_coverage_diff() {
		return '
SELECT
    runtime.path AS file_path,
    runtime.lines_covered AS runtime_coverage,
    test.line AS test_coverage,
    runtime.lines_covered - test.line AS coverage_difference
        FROM
    (
        SELECT
            path,
            COUNT(DISTINCT line) AS lines_covered
        FROM
            wp_jetpack_runtime_coverage_data
        GROUP BY
            path
    ) AS runtime
    INNER JOIN
    (
        SELECT
            path,
            line
        FROM
            wp_jetpack_test_coverage_data
    ) AS test
    ON runtime.path = test.path
    ORDER BY coverage_difference
';
	}
}

if ( isset( $_COOKIE['jetpack_enable_coverage_logging'] ) ) {
	new Coverage_Logger();
}
