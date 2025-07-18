<?php
/**
 * Jetpack Backup Size Estimator
 *
 * @package automattic/jetpack-backup-plugin
 */

// After changing this file, consider increasing the version number ("VXXX") in all the files using this namespace, in
// order to ensure that the specific version of this file always get loaded. Otherwise, Jetpack autoloader might decide
// to load an older/newer version of the class (if, for example, both the standalone and bundled versions of the plugin
// are installed, or in some other cases).
namespace Automattic\Jetpack\Backup\V0005;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use WP_Error;

/**
 * Class Jetpack_Backup_Size_Estimator
 *
 * Estimates backup size by scanning local filesystem and database
 */
class Jetpack_Backup_Size_Estimator {

	/**
	 * Maximum execution time in seconds
	 */
	const DEFAULT_TIMEOUT = 25;

	/**
	 * Total file size in bytes
	 *
	 * @var int
	 */
	private $file_size = 0;

	/**
	 * Total file count
	 *
	 * @var int
	 */
	private $file_count = 0;

	/**
	 * Directory sizes breakdown
	 *
	 * @var array
	 */
	private $directory_sizes = array();

	/**
	 * Database table sizes breakdown
	 *
	 * @var array
	 */
	private $database_tables = array();

	/**
	 * Scan start time
	 *
	 * @var float
	 */
	private $start_time;

	/**
	 * Timeout in seconds
	 *
	 * @var int
	 */
	private $timeout;

	/**
	 * Constructor
	 *
	 * @param int $timeout Maximum execution time in seconds.
	 */
	public function __construct( $timeout = self::DEFAULT_TIMEOUT ) {
		$this->start_time = microtime( true );
		$this->timeout    = $timeout;
	}

	/**
	 * Estimate backup size
	 *
	 * @return array|WP_Error
	 */
	public function estimate_size() {
		$this->start_time = microtime( true );

		$directories = $this->get_scan_directories();

		foreach ( $directories as $label => $path ) {
			if ( $this->is_timeout_approaching() ) {
				break;
			}

			$this->scan_directory( $path, $label );
		}

		if ( ! $this->is_timeout_approaching() ) {
			$this->get_database_size();
		}

		$database_size    = $this->get_total_database_size();
		$processing_time  = microtime( true ) - $this->start_time;
		$timeout_occurred = $this->is_timeout_approaching();

		return array(
			'file_size'       => $this->file_size,
			'database_size'   => $database_size,
			'total_size'      => $this->file_size + $database_size,
			'directories'     => $this->directory_sizes,
			'database_tables' => $this->database_tables,
			'file_count'      => $this->file_count,
			'database_count'  => $this->get_database_count(),
			'completed'       => ! $timeout_occurred,
			'timeout'         => $timeout_occurred,
			'processing_time' => round( $processing_time, 2 ),
		);
	}

	/**
	 * Get directories to scan in priority order
	 *
	 * @return array
	 */
	private function get_scan_directories() {
		$upload_dir = wp_get_upload_dir();

		return array(
			'plugins'  => WP_PLUGIN_DIR,
			'themes'   => WP_CONTENT_DIR . '/themes',
			'uploads'  => $upload_dir['basedir'],
			'contents' => WP_CONTENT_DIR,
			'roots'    => ABSPATH,
		);
	}

	/**
	 * Scan directory for files
	 *
	 * @param string $path Directory path.
	 * @param string $label Directory label.
	 * @return void
	 */
	private function scan_directory( $path, $label ) {
		if ( ! is_dir( $path ) || ! is_readable( $path ) ) {
			$this->directory_sizes[ $label ] = 0;
			return;
		}

		$directory_size  = 0;
		$directory_files = 0;

		try {
			$iterator = new RecursiveIteratorIterator(
				new RecursiveDirectoryIterator( $path, RecursiveDirectoryIterator::SKIP_DOTS ),
				RecursiveIteratorIterator::SELF_FIRST
			);

			foreach ( $iterator as $file ) {
				if ( $this->is_timeout_approaching() ) {
					break;
				}

				if ( ! $file->isFile() ) {
					continue;
				}

				$file_path = $file->getPathname();

				if ( $this->is_file_in_other_scan_directory( $file_path, $label ) ) {
					continue;
				}

				$file_size = $this->get_file_size( $file_path );
				if ( $file_size !== false ) {
					$directory_size  += $file_size;
					$this->file_size += $file_size;
					++$directory_files;
				}
			}
		} catch ( \Exception $e ) {
			// Continue on error, directory might be inaccessible.
			unset( $e );
		}

		$this->directory_sizes[ $label ] = $directory_size;
		$this->file_count               += $directory_files;
	}

	/**
	 * Check if file is in another directory we're scanning separately
	 *
	 * Only skips files that are in more specific (nested) directories
	 * that will be scanned separately to avoid double-counting.
	 *
	 * @param string $file_path File path.
	 * @param string $current_label Current directory label.
	 * @return bool
	 */
	private function is_file_in_other_scan_directory( $file_path, $current_label ) {
		$scan_paths   = $this->get_scan_directories();
		$current_path = $scan_paths[ $current_label ];

		foreach ( $scan_paths as $label => $path ) {
			if ( $label === $current_label ) {
				continue;
			}

			if ( $this->is_subdirectory( $path, $current_path ) && strpos( $file_path, $path ) === 0 ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if one directory is a subdirectory of another
	 *
	 * @param string $subdirectory Potential subdirectory path.
	 * @param string $parent_directory Parent directory path.
	 * @return bool
	 */
	private function is_subdirectory( $subdirectory, $parent_directory ) {
		$subdirectory     = rtrim( $subdirectory, '/' );
		$parent_directory = rtrim( $parent_directory, '/' );

		return strpos( $subdirectory, $parent_directory ) === 0 &&
				strlen( $subdirectory ) > strlen( $parent_directory );
	}

	/**
	 * Get file size with safety checks
	 *
	 * @param string $file_path File path.
	 * @return int|false File size in bytes or false on error
	 */
	private function get_file_size( $file_path ) {
		if ( ! file_exists( $file_path ) || ! is_readable( $file_path ) ) {
			return false;
		}

		$stat = stat( $file_path );
		if ( $stat === false ) {
			return false;
		}

		if ( $stat['size'] < 0 ) {
			return false;
		}

		return $stat['size'];
	}

	/**
	 * Get database count
	 *
	 * @return int
	 */
	private function get_database_count() {
		return count( $this->database_tables );
	}

	/**
	 * Get database size per table
	 *
	 * @return void
	 */
	private function get_database_size() {
		global $wpdb;

		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$results = $wpdb->get_results(
			'SELECT table_name, data_length + index_length as size
			 FROM information_schema.tables
			 WHERE table_schema = DATABASE()'
		);

		if ( ! is_array( $results ) ) {
			$this->database_tables = array();
			return;
		}

		foreach ( $results as $row ) {
			$this->database_tables[ $row->table_name ] = (int) $row->size;
		}
	}

	/**
	 * Get total database size
	 *
	 * @return int
	 */
	private function get_total_database_size() {
		return array_sum( $this->database_tables );
	}

	/**
	 * Check if timeout is approaching
	 *
	 * @return bool
	 */
	private function is_timeout_approaching() {
		$current_time = microtime( true );
		$elapsed      = $current_time - $this->start_time;

		// Leave 2 seconds buffer for cleanup
		return $elapsed >= ( $this->timeout - 2 );
	}
}
