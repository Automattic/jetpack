<?php
/**
 * Report CSV Generator
 *
 * Generates CSV files from report data arrays.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\Logger_Interface;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\Logger_Trait;
use WP_Error;

/**
 * CSV Generator class for creating CSV files from report data.
 *
 * @since $$next-version$$
 */
class Report_Csv_Generator {

	use Logger_Trait;

	/**
	 * Constructor.
	 *
	 * @param Logger_Interface $logger The logger instance.
	 */
	public function __construct( Logger_Interface $logger ) {
		$this->logger = $logger;
	}

	/**
	 * Generate a CSV file from report data.
	 *
	 * @param array    $data     Report data array with 'data' key containing rows.
	 * @param array    $columns  Column definitions ['key' => 'Label'].
	 * @param callable $formatter Row formatter callback.
	 * @param string   $filename Optional filename (without extension).
	 * @return string|WP_Error File path on success, WP_Error on failure.
	 */
	public function generate( array $data, array $columns, callable $formatter, string $filename = '' ) {
		try {
			// Generate filename if not provided.
			if ( empty( $filename ) ) {
				$filename = 'report-export-' . gmdate( 'Y-m-d-His' );
			}

			// Create temp file.
			$file_path = $this->create_temp_file( $filename );
			if ( is_wp_error( $file_path ) ) {
				return $file_path;
			}

			// Open file for writing.
			$handle = fopen( $file_path, 'w' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
			if ( false === $handle ) {
				$this->logger->log_error( 'Failed to open CSV file for writing: ' . $file_path, __METHOD__ );
				return new WP_Error(
					'csv_file_open_failed',
					__( 'Failed to open CSV file for writing.', 'jetpack-premium-analytics' )
				);
			}

			$rows = $data['data'] ?? array();

			// Use try/finally so the file handle is always closed, even if the formatter throws.
			try {
				// Write BOM for UTF-8 (helps Excel recognize encoding).
				$this->write_bom( $handle );

				// Write header row (labels are our own strings, but escape for consistency).
				$this->write_csv_row( $handle, array_map( array( self::class, 'escape_csv_value' ), array_values( $columns ) ) );

				// Write data rows.
				foreach ( $rows as $row ) {
					$formatted_row = call_user_func( $formatter, $row );

					// Skip empty rows (when formatter returns empty array).
					if ( empty( $formatted_row ) ) {
						continue;
					}

					// Extract values in the same order as columns, neutralizing CSV formula injection.
					$csv_row = array();
					foreach ( array_keys( $columns ) as $column_key ) {
						$csv_row[] = self::escape_csv_value( $formatted_row[ $column_key ] ?? '' );
					}

					$this->write_csv_row( $handle, $csv_row );
				}
			} finally {
				fclose( $handle ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
			}

			$this->logger->log_message(
				sprintf( 'CSV file generated successfully: %s (%d rows)', $file_path, count( $rows ) ),
				__METHOD__
			);

			return $file_path;

		} catch ( \Throwable $e ) {
			// Remove any partially written file so it does not linger in the exports dir.
			if ( isset( $file_path ) && is_string( $file_path ) && file_exists( $file_path ) ) {
				wp_delete_file( $file_path );
			}
			// Catch Throwable (not just Exception) so a formatter TypeError still returns WP_Error
			// and cleans up; log_error keeps within the logger's Exception-typed log_exception().
			$this->logger->log_error( $e->getMessage(), __METHOD__ );
			return new WP_Error(
				'csv_generation_failed',
				__( 'Failed to generate CSV file.', 'jetpack-premium-analytics' ),
				array( 'exception' => $e->getMessage() )
			);
		}
	}

	/**
	 * Neutralize CSV formula injection.
	 *
	 * Spreadsheet apps execute a cell whose value begins with =, +, -, @, tab, or CR.
	 * Prefixing with a single quote renders it as literal text. Exported values (e.g.
	 * product names) are store data and must not be trusted.
	 *
	 * @param mixed $value The cell value.
	 * @return string The escaped value.
	 */
	private static function escape_csv_value( $value ): string {
		$value = (string) $value;

		// Leave legitimate numbers (including negatives like -12.00) untouched; only neutralize
		// values that begin with a formula trigger and are not numeric.
		if ( '' !== $value && ! is_numeric( $value ) && in_array( $value[0], array( '=', '+', '-', '@', "\t", "\r" ), true ) ) {
			return "'" . $value;
		}

		return $value;
	}

	/**
	 * Write the UTF-8 BOM.
	 *
	 * @param resource $handle File handle.
	 * @return void
	 * @throws \RuntimeException When the BOM cannot be written fully.
	 */
	private function write_bom( $handle ): void {
		$bom           = "\xEF\xBB\xBF";
		$bytes_written = fwrite( $handle, $bom ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite

		if ( strlen( $bom ) !== $bytes_written ) {
			throw new \RuntimeException( 'Failed to write CSV BOM.' );
		}
	}

	/**
	 * Write one CSV row.
	 *
	 * @param resource $handle File handle.
	 * @param array    $row    CSV row.
	 * @return void
	 * @throws \RuntimeException When the row cannot be written.
	 */
	private function write_csv_row( $handle, array $row ): void {
		$bytes_written = fputcsv( $handle, $row, ',', '"', '\\' );

		if ( false === $bytes_written || 0 === $bytes_written ) {
			throw new \RuntimeException( 'Failed to write CSV row.' );
		}
	}

	/**
	 * Create a temporary file for CSV export.
	 *
	 * @param string $filename The filename (without extension).
	 * @return string|WP_Error File path on success, WP_Error on failure.
	 */
	private function create_temp_file( string $filename ) {
		// Use WordPress upload directory.
		$upload_dir = wp_upload_dir();

		if ( ! empty( $upload_dir['error'] ) ) {
			$this->logger->log_error( 'Upload directory error: ' . $upload_dir['error'], __METHOD__ );
			return new WP_Error(
				'upload_dir_error',
				$upload_dir['error']
			);
		}

		// Create exports subdirectory.
		$export_dir = trailingslashit( $upload_dir['basedir'] ) . 'jetpack-premium-analytics-exports';

		if ( ! file_exists( $export_dir ) ) {
			wp_mkdir_p( $export_dir );
		}

		// Ensure we can write to the directory.
		if ( ! wp_is_writable( $export_dir ) ) {
			$this->logger->log_error( 'Export directory is not writable: ' . $export_dir, __METHOD__ );
			return new WP_Error(
				'directory_not_writable',
				__( 'Export directory is not writable.', 'jetpack-premium-analytics' )
			);
		}

		// Drop directory-listing/access protection so exports are not enumerable or web-served.
		$this->protect_export_dir( $export_dir );

		// Sanitize filename, add an unguessable suffix, and add extension. Files are delivered as
		// email attachments; the random suffix is defense-in-depth against URL guessing.
		$safe_filename = sanitize_file_name( $filename ) . '-' . wp_generate_password( 12, false ) . '.csv';

		return trailingslashit( $export_dir ) . $safe_filename;
	}

	/**
	 * Write index.html + .htaccess guards into the export directory (best-effort, idempotent).
	 *
	 * @param string $export_dir The export directory path.
	 * @return void
	 */
	private function protect_export_dir( string $export_dir ): void {
		$index = trailingslashit( $export_dir ) . 'index.html';
		if ( ! file_exists( $index ) ) {
			@file_put_contents( $index, '' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents, WordPress.PHP.NoSilencedErrors.Discouraged
		}

		$htaccess = trailingslashit( $export_dir ) . '.htaccess';
		if ( ! file_exists( $htaccess ) ) {
			// Dual syntax so it denies on both Apache 2.4 (mod_authz_core) and 2.2, and is inert on nginx.
			$rules = "<IfModule mod_authz_core.c>\n\tRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n\tOrder allow,deny\n\tDeny from all\n</IfModule>\n";
			@file_put_contents( $htaccess, $rules ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents, WordPress.PHP.NoSilencedErrors.Discouraged
		}
	}

	/**
	 * Delete a CSV file.
	 *
	 * @param string $file_path The file path.
	 * @return bool True on success, false on failure.
	 */
	public function delete_file( string $file_path ): bool {
		if ( ! file_exists( $file_path ) ) {
			return false;
		}

		$deleted = wp_delete_file( $file_path );

		if ( $deleted ) {
			$this->logger->log_message( 'CSV file deleted: ' . $file_path, __METHOD__ );
		} else {
			$this->logger->log_error( 'Failed to delete CSV file: ' . $file_path, __METHOD__ );
		}

		return $deleted;
	}

	/**
	 * Stream a CSV file for download.
	 *
	 * @param string $file_path The file path.
	 * @param string $filename  Optional download filename.
	 * @return bool True on success, false on failure.
	 */
	public function stream_file( string $file_path, string $filename = '' ): bool {
		if ( ! file_exists( $file_path ) ) {
			$this->logger->log_error( 'CSV file not found for streaming: ' . $file_path, __METHOD__ );
			return false;
		}

		if ( empty( $filename ) ) {
			$filename = basename( $file_path );
		}

		// Check if headers have already been sent.
		if ( headers_sent() ) {
			$this->logger->log_error( 'Headers already sent, cannot stream file', __METHOD__ );
			return false;
		}

		// Set headers for file download.
		header( 'Content-Type: text/csv; charset=utf-8' );
		header( 'X-Content-Type-Options: nosniff' );
		// Strip path + CR/LF/quotes so the filename cannot inject additional headers.
		$safe_filename = str_replace( array( "\r", "\n", '"' ), '', basename( $filename ) );
		header( 'Content-Disposition: attachment; filename="' . $safe_filename . '"' );
		header( 'Content-Length: ' . filesize( $file_path ) );
		header( 'Pragma: no-cache' );
		header( 'Expires: 0' );

		// Output file contents.
		readfile( $file_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_readfile

		return true;
	}
}
