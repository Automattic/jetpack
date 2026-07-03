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

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\LoggerInterface;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\LoggerTrait;
use Exception;
use WP_Error;

/**
 * CSV Generator class for creating CSV files from report data.
 *
 * @since x.x.x
 * @internal
 */
class ReportCSVGenerator {

	use LoggerTrait;

	/**
	 * Constructor.
	 *
	 * @param LoggerInterface $logger The logger instance.
	 */
	public function __construct( LoggerInterface $logger ) {
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

			// Write BOM for UTF-8 (helps Excel recognize encoding).
			fwrite( $handle, "\xEF\xBB\xBF" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite

			// Write header row.
			fputcsv( $handle, array_values( $columns ), ',', '"', '\\' );

			// Write data rows.
			$rows = $data['data'] ?? array();
			foreach ( $rows as $row ) {
				$formatted_row = call_user_func( $formatter, $row );

				// Skip empty rows (when formatter returns empty array).
				if ( empty( $formatted_row ) ) {
					continue;
				}

				// Extract values in the same order as columns.
				$csv_row = array();
				foreach ( array_keys( $columns ) as $column_key ) {
					$csv_row[] = $formatted_row[ $column_key ] ?? '';
				}

				fputcsv( $handle, $csv_row, ',', '"', '\\' );
			}

			fclose( $handle ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose

			$this->logger->log_message(
				sprintf( 'CSV file generated successfully: %s (%d rows)', $file_path, count( $rows ) ),
				__METHOD__
			);

			return $file_path;

		} catch ( Exception $e ) {
			$this->logger->log_exception( $e, __METHOD__ );
			return new WP_Error(
				'csv_generation_failed',
				__( 'Failed to generate CSV file.', 'jetpack-premium-analytics' ),
				array( 'exception' => $e->getMessage() )
			);
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
		$export_dir = trailingslashit( $upload_dir['basedir'] ) . 'woocommerce-analytics-exports';

		if ( ! file_exists( $export_dir ) ) {
			wp_mkdir_p( $export_dir );
		}

		// Sanitize filename and add extension.
		$safe_filename = sanitize_file_name( $filename ) . '.csv';
		$file_path     = trailingslashit( $export_dir ) . $safe_filename;

		// Ensure we can write to the directory.
		if ( ! is_writable( $export_dir ) ) {
			$this->logger->log_error( 'Export directory is not writable: ' . $export_dir, __METHOD__ );
			return new WP_Error(
				'directory_not_writable',
				__( 'Export directory is not writable.', 'jetpack-premium-analytics' )
			);
		}

		return $file_path;
	}

	/**
	 * Get the URL for a generated CSV file.
	 *
	 * @param string $file_path The file path.
	 * @return string|WP_Error The URL or error.
	 */
	public function get_file_url( string $file_path ) {
		if ( ! file_exists( $file_path ) ) {
			return new WP_Error(
				'file_not_found',
				__( 'CSV file not found.', 'jetpack-premium-analytics' )
			);
		}

		$upload_dir = wp_upload_dir();
		$base_dir   = trailingslashit( $upload_dir['basedir'] );
		$base_url   = trailingslashit( $upload_dir['baseurl'] );

		// Replace base directory with base URL.
		$file_url = str_replace( $base_dir, $base_url, $file_path );

		return $file_url;
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
		header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
		header( 'Content-Length: ' . filesize( $file_path ) );
		header( 'Pragma: no-cache' );
		header( 'Expires: 0' );

		// Output file contents.
		readfile( $file_path ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_readfile

		return true;
	}
}
