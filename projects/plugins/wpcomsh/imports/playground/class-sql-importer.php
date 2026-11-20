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
	 * How much of mysql's output to read back. Its error comes last, and on some hosts it first echoes
	 * the failing statement, which can be hundreds of MB.
	 */
	private const MAX_OUTPUT_BYTES = 4096;

	/**
	 * Marks the line that carries mysql's exit status, since the shell reports tail's.
	 */
	private const EXIT_STATUS_MARKER = 'wpcomsh-mysql-exit:';

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

		if ( ! $verbose ) {
			// Read back only the end of mysql's output, so a huge echoed statement can't exhaust PHP's memory,
			// and append mysql's exit status, since the pipeline's status is tail's.
			$command = sprintf( '{ %s; echo "%s$?"; } | tail -c %d', $command, self::EXIT_STATUS_MARKER, self::MAX_OUTPUT_BYTES );
		}

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.system_calls_exec
		exec( $command, $output, $ret );

		if ( ! $verbose ) {
			$ret = self::pop_exit_status( $output, $ret );
		}

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
	 * Remove the exit status line from the output and return mysql's exit status.
	 *
	 * @param string[] $output   Lines of output.
	 * @param int|null $fallback The pipeline's exit status, used if the marker is missing.
	 *
	 * @return int
	 */
	private static function pop_exit_status( array &$output, $fallback ): int {
		$last = end( $output );
		if ( is_string( $last ) && str_starts_with( $last, self::EXIT_STATUS_MARKER ) ) {
			array_pop( $output );
			return (int) substr( $last, strlen( self::EXIT_STATUS_MARKER ) );
		}

		// No marker: the pipeline itself failed. Never report success.
		return $fallback ? (int) $fallback : 1;
	}

	/**
	 * The mysql client's error on one line, truncated, without its password warning.
	 *
	 * Prefers mysql's ERROR lines, since some hosts echo the failing statement before them.
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

		$errors = array_filter(
			$lines,
			static function ( $line ) {
				return str_starts_with( $line, 'ERROR' );
			}
		);

		$details = implode( ' ', $errors ? $errors : $lines );
		if ( strlen( $details ) > self::MAX_ERROR_DETAILS_BYTES ) {
			// Keep the end, where mysql reports the error.
			$details = '…' . mb_strcut( $details, strlen( $details ) - self::MAX_ERROR_DETAILS_BYTES );
		}

		return $details;
	}
}
