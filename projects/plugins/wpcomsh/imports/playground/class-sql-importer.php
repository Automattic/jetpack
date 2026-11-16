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
	 * How much of mysql's output to keep in an error. Its errors quote the SQL near the failure.
	 */
	private const MAX_ERROR_DETAILS_BYTES = 500;

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

		$host = DB_HOST;
		$port = '';
		if ( preg_match( '/^(.+):(\d+)$/', $host, $m ) ) {
			$host = $m[1];
			$port = $m[2];
		}

		$output  = null;
		$ret     = null;
		$command = sprintf(
			'mysql -u %s%s -h %s%s %s%s < %s',
			escapeshellarg( DB_USER ),
			DB_PASSWORD === '' ? '' : ' -p' . escapeshellarg( DB_PASSWORD ),
			escapeshellarg( $host ),
			$port === '' ? '' : ' --port=' . escapeshellarg( $port ),
			escapeshellarg( DB_NAME ),
			$verbose ? '' : ' 2>&1',
			escapeshellarg( $sql_file_path )
		);

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_exec
		exec( $command, $output, $ret );

		if ( $ret === 0 ) {
			return true;
		}

		// Keep mysql's error, e.g. a packet over max_allowed_packet, so the failure can be told apart.
		$message = __( 'SQL import failed', 'wpcomsh' );
		$details = self::get_error_details( (array) $output );
		if ( $details !== '' ) {
			$message .= ': ' . $details;
		}

		return new WP_Error( 'sql-import-failed', $message );
	}

	/**
	 * The mysql client's output, without its password warning, on one line and truncated.
	 *
	 * @param string[] $output Lines of output.
	 *
	 * @return string
	 */
	private static function get_error_details( array $output ): string {
		$lines = array_filter(
			array_map( 'trim', $output ),
			static function ( $line ) {
				return $line !== '' && ! str_contains( $line, 'Using a password on the command line' );
			}
		);

		$details = implode( ' ', $lines );
		if ( strlen( $details ) > self::MAX_ERROR_DETAILS_BYTES ) {
			$details = mb_strcut( $details, 0, self::MAX_ERROR_DETAILS_BYTES ) . '…';
		}

		return $details;
	}
}
