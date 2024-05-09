<?php
/*
 * This file may be called before WordPress is fully initialized. See the README file for info.
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress;

/**
 * A utility that manages logging for the boost cache.
 */
class Logger {
	/**
	 * The singleton instance of the logger.
	 *
	 * @var self
	 */
	private static $instance = null;

	/**
	 * The header to place on top of every log file.
	 */
	const LOG_HEADER = "<?php die(); // This file is not intended to be accessed directly. ?>\n\n";

	/**
	 * The directory where log files are stored.
	 */
	const LOG_DIRECTORY = WP_CONTENT_DIR . '/boost-cache/logs';

	/**
	 * The Process Identifier used by this Logger instance.
	 *
	 * @var int|float
	 */
	private $pid = null;

	/**
	 * Get the singleton instance of the logger.
	 */
	public static function get_instance() {
		if ( self::$instance !== null ) {
			return self::$instance;
		}

		$instance          = new Logger();
		$prepared_log_file = $instance->prepare_file();
		if ( $prepared_log_file instanceof Boost_Cache_Error ) {
			return $prepared_log_file;
		}

		self::$instance = $instance;
		return $instance;
	}

	private function __construct() {
		if ( function_exists( 'getmypid' ) ) {
			$this->pid = getmypid();
		} else {
			// Where PID is not available, use the microtime of the first log of the session.
			$this->pid = microtime( true );
		}
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
		if ( ! Filesystem_Utils::create_directory( $directory ) ) {
			return new Boost_Cache_Error( 'could-not-create-log-dir', 'Could not create boost cache log directory' );
		}

		return Filesystem_Utils::write_to_file( $log_file, self::LOG_HEADER );
	}

	/**
	 * Add a debug message to the log file after doing necessary checks.
	 */
	public static function debug( $message ) {
		$settings = Boost_Cache_Settings::get_instance();
		if ( ! $settings->get_logging() ) {
			return;
		}

		$logger = self::get_instance();

		// TODO: Check to make sure that current request IP is allowed to create logs.

		if ( $logger instanceof Boost_Cache_Error ) {
			return;
		}

		$logger->log( $message );
	}

	/**
	 * Writes a message to the log file.
	 *
	 * @param string $message - The message to write to the log file.
	 */
	public function log( $message ) {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$request_uri = htmlspecialchars( isset( $_SERVER['REQUEST_URI'] ) ? $_SERVER['REQUEST_URI'] : '<unknown request uri>', ENT_QUOTES, 'UTF-8' );

		// don't log the ABSPATH constant. Logs may be copied to a public forum.
		$message = str_replace( ABSPATH, '[...]/', $message );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.json_encode_json_encode
		$line = json_encode(
			array(
				'time' => gmdate( 'Y-m-d H:i:s' ),
				'pid'  => $this->pid,
				'uri'  => $request_uri,
				'msg'  => $message,
				'uid'  => uniqid(), // Uniquely identify this log line.
			)
		);

		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		error_log( $line . PHP_EOL, 3, $this->get_log_file() );
	}

	/**
	 * Reads the log file and returns the contents.
	 *
	 * @return string
	 */
	public static function read() {
		$instance = self::get_instance();

		// If we failed to set up a Logger instance (e.g.: unwriteable directory), return the error as log content.
		if ( $instance instanceof Boost_Cache_Error ) {
			return $instance->get_error_message();
		}

		$log_file = $instance->get_log_file();
		if ( ! file_exists( $log_file ) ) {
			return '';
		}

		// Get the content after skipping the LOG_HEADER.
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$logs  = file_get_contents( $log_file, false, null, strlen( self::LOG_HEADER ) ) ?? '';
		$logs  = explode( PHP_EOL, $logs );
		$lines = array();

		foreach ( $logs as $log ) {
			$line = json_decode( $log, true );
			if ( json_last_error() !== JSON_ERROR_NONE || ! is_array( $line ) ) {
				continue;
			}

			// The current log format requires time, pid, uri, and msg.
			if ( ! isset( $line['time'] ) || ! isset( $line['pid'] ) || ! isset( $line['uri'] ) || ! isset( $line['msg'] ) ) {
				continue;
			}

			$info = sprintf(
				'[%s] [%s] ',
				$line['time'],
				$line['pid']
			);

			$formatted = $info . $line['uri'];
			// Add msg to the next line offset by the length of the info string.
			$formatted .= PHP_EOL . str_repeat( ' ', strlen( $info ) ) . $line['msg'];

			$lines[] = $formatted;
		}

		return implode( PHP_EOL, $lines );
	}

	/**
	 * Returns the path to the log file.
	 *
	 * @return string
	 */
	private static function get_log_file() {
		$today = gmdate( 'Y-m-d' );
		return self::LOG_DIRECTORY . "/log-{$today}.log.php";
	}

	public static function delete_old_logs() {
		Filesystem_Utils::gc_expired_files( self::LOG_DIRECTORY, 24 * 60 * 60 );
	}
}
