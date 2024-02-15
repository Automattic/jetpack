<?php

namespace Automattic\Jetpack_Boost\Modules\Page_Cache;

/**
 * A utility that manages logging for the boost cache.
 */
class Logger {
	/**
	 * The singleton instance of the logger.
	 */
	private static $instance = null;

	/**
	 * The header to place on top of every log file.
	 */
	const LOG_HEADER = "<?php die(); // This file is not intended to be accessed directly. ?>\n\n";

	/**
	 * Get the singleton instance of the logger.
	 */
	public static function get_instance() {
		if ( self::$instance !== null ) {
			return self::$instance;
		}

		$instance          = new Logger();
		$prepared_log_file = $instance->prepare_file();
		if ( is_wp_error( $prepared_log_file ) ) {
			return $prepared_log_file;
		}

		self::$instance = $instance;
		return $instance;
	}

	/**
	 * Ensure that the log file exists, and if not, create it.
	 */
	private function prepare_file() {
		$log_file = $this->get_log_file();
		if ( file_exists( $log_file ) ) {
			return true;
		}

		$directory = dirname( $log_file );
		if ( ! Boost_Cache_Utils::create_directory( $directory ) ) {
			return new \WP_Error( 'Could not create boost cache log directory' );
		}

		return Boost_Cache_Utils::write_to_file( $log_file, self::LOG_HEADER );
	}

	/**
	 * Add a debug message that logs request specific events.
	 *
	 * Use this for logging cache hits, misses, and other request specific events.
	 * It will filter out requests for wp-admin and other non-cacheable requests.
	 *
	 * @param string $message - The message to write to the log file.
	 */
	public static function request_debug( $message ) {
		$request = new Request();
		if ( $request->is_cacheable() ) {
			self::debug( $message );
		}
	}

	/**
	 * Add a debug message to the log file after doing necessary checks.
	 */
	public static function debug( $message ) {
		$logger = self::get_instance();

		// TODO: Check to make sure that logging is enabled in the settings.
		// TODO: Check to make sure that current request IP is allowed to create logs.

		if ( ! is_wp_error( $logger ) ) {
			$logger->log( $message );
		}
	}

	/**
	 * Writes a message to the log file.
	 *
	 * @param string $message - The message to write to the log file.
	 */
	public function log( $message ) {
		$request     = new Request();
		$request_uri = htmlspecialchars( $request->get_uri(), ENT_QUOTES, 'UTF-8' );
		$line        = gmdate( 'H:i:s' ) . ' ' . getmypid() . "\t{$request_uri}\t\t{$message}" . PHP_EOL;
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( $line, 3, $this->get_log_file() );
	}

	/**
	 * Reads the log file and returns the contents.
	 *
	 * @return string
	 */
	public function read() {
		$log_file = $this->get_log_file();

		if ( ! file_exists( $log_file ) ) {
			return '';
		}

		// Get the content after skipping the LOG_HEADER.
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		return file_get_contents( $log_file, false, null, strlen( self::LOG_HEADER ) ) || '';
	}

	/**
	 * Returns the path to the log file.
	 *
	 * @return string
	 */
	private static function get_log_file() {
		$today = gmdate( 'Y-m-d' );
		return WP_CONTENT_DIR . "/boost-cache/logs/log-{$today}.log.php";
	}
}
