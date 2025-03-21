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

	const DATABASE_NAME = 'jetpack_coverage_data';

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

		$sql = sprintf( 'INSERT INTO `%s` (path, line) VALUES ', $wpdb->prefix . self::DATABASE_NAME );

		foreach ( $coverage_data as $file => $lines ) {
			$path = substr( $file, strlen( ABSPATH ) );

			if ( ! str_starts_with( $path, 'wp-content/plugins/jetpack' ) ) {
				continue;
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
		$table_name      = $wpdb->prefix . self::DATABASE_NAME;

		$sql = "CREATE TABLE $table_name (
  id mediumint(9) NOT NULL AUTO_INCREMENT,
  path varchar(255),
  line int,
  PRIMARY KEY (id)
) $charset_collate;";

		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		dbDelta( $sql );
	}
}

if ( isset( $_COOKIE['jetpack_enable_coverage_logging'] ) ) {
	new Coverage_Logger();
}
