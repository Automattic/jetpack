<?php
/**
 * SQL_Importer file.
 *
 * @package wpcomsh
 */

namespace Imports;

use WP_Error;

/**
 * Import a SQL dump in current database.
 */
class SQL_Importer {
	/**
	 * Import the dump file.
	 *
	 * @param string $sql_file_path The path of the SQL file.
	 * @param bool   $verbose       Whether to run the command in verbose mode.
	 *
	 * @return bool|WP_Error
	 */
	public static function import( string $sql_file_path, $verbose = false ) {
		// Bail if the file doesn't exist.
		if ( ! is_file( $sql_file_path ) || ! is_readable( $sql_file_path ) ) {
			return new WP_Error( 'sql-file-not-exists', __( 'SQL file not exists', 'wpcomsh' ) );
		}

		$output  = null;
		$ret     = null;
		$command = sprintf(
			'mysql -u %s%s -h %s %s%s < %s',
			escapeshellarg( DB_USER ),
			DB_PASSWORD === '' ? '' : ' -p' . escapeshellarg( DB_PASSWORD ),
			escapeshellarg( DB_HOST ),
			escapeshellarg( DB_NAME ),
			$verbose ? '' : ' 2>&1',
			escapeshellarg( $sql_file_path )
		);

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_exec
		exec( $command, $output, $ret );

		return $ret === 0 ? true : new WP_Error( 'sql-import-failed', __( 'SQL import failed', 'wpcomsh' ) );
	}
}
