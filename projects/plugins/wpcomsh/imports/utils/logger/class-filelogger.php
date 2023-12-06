<?php
/**
 * FileLogger file.
 *
 * @package wpcomsh
 */

namespace Imports\Utils\Logger;

use Imports\Utils\LoggerInterface;

require_once __DIR__ . '/class-logger-interface.php';

/**
 * Class FileLogger
 *
 * The FileLogger class provides a mechanism for logging messages to a file.
 * It implements the LoggerInterface.
 */
class FileLogger implements LoggerInterface {
	/**
	 * The path to the log file.
	 *
	 * @var string
	 */
	private $log_file;

	/**
	 * FileLogger constructor.
	 *
	 * Initializes a new instance of the FileLogger class with the specified
	 * log file. If the log file exists, it is cleared; if it does not exist,
	 * it is created.
	 *
	 * @param string $log_file The path to the log file.
	 */
	public function __construct( $log_file ) {
		$result = $this->check_and_clear_file( $log_file );
		if ( $result ) {
			$this->log_file = $log_file;
		}
	}

	/**
	 * Logs a message to the log file.
	 *
	 * @param string $message The message to log.
	 */
	public function log( $message ) {
		/**
		 * We can't use WP_Filesystem::put_contents because it uses
		 * write mode instead of append, so all the content gets overriden.
		 */
		if ( ! $this->log_file ) {
			return;
		}
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
		$log_file = fopen( $this->log_file, 'a' );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite
		fwrite( $log_file, gmdate( 'c' ) . ' ' . $message . "\n" );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose
		fclose( $log_file );
	}

	/**
	 * Checks and clears a file.
	 *
	 * @param string $file_path The path of the file to check and clear.
	 * @return bool True if the directory exists or was successfully created and the file was created or truncated, false otherwise.
	 */
	private function check_and_clear_file( $file_path ) {
		$directory = pathinfo( $file_path, PATHINFO_DIRNAME );
		if ( ! is_dir( $directory ) && ! wp_mkdir_p( $directory ) ) {
			return false;
		}

		// Create or truncate the file
		file_put_contents( $file_path, '' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		return true;
	}
}
