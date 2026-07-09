<?php
/**
 * Debug logger for the CSV report export pipeline.
 *
 * @package automattic/jetpack-premium-analytics
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging;

defined( 'ABSPATH' ) || exit;

use Throwable;
use WC_Log_Levels;
use WC_Logger_Interface;

/**
 * Class Debug_Logger
 *
 * @since $$next-version$$
 */
class Debug_Logger implements Logger_Interface {

	/**
	 * WooCommerce logger class instance.
	 *
	 * @var WC_Logger_Interface
	 */
	private $logger;

	/**
	 * Constructor.
	 *
	 * @param WC_Logger_Interface $wc_logger The WooCommerce logger.
	 */
	public function __construct( WC_Logger_Interface $wc_logger ) {
		$this->logger = $wc_logger;
	}

	/**
	 * Log an exception.
	 *
	 * @param Throwable $exception The exception to log.
	 * @param string    $method    The method that threw the exception.
	 */
	public function log_exception( Throwable $exception, string $method ): void {
		$this->log( $exception->getMessage(), $method, WC_Log_Levels::ERROR );
	}

	/**
	 * Log an error.
	 *
	 * @param string $message The error message.
	 * @param string $method  The method that threw the error.
	 */
	public function log_error( string $message, string $method ): void {
		$this->log( $message, $method, WC_Log_Levels::ERROR );
	}

	/**
	 * Log a generic note.
	 *
	 * @param string $message The message to log.
	 * @param string $method  The method that generated the message.
	 */
	public function log_message( string $message, string $method ): void {
		$this->log( $message, $method );
	}

	/**
	 * Log a JSON response.
	 *
	 * @param mixed  $response The response to log.
	 * @param string $method   The method that generated the response.
	 */
	public function log_response( $response, string $method ): void {
		$message = wp_json_encode( $response, JSON_PRETTY_PRINT );
		// wp_json_encode() returns false on failure; keep log() (string, strict_types) safe.
		$this->log( false === $message ? '' : $message, $method );
	}

	/**
	 * Log a message as a debug log entry.
	 *
	 * @param string $message The message to log.
	 * @param string $method  The method that generated the message.
	 * @param string $level   The log level.
	 */
	protected function log( string $message, string $method, string $level = WC_Log_Levels::DEBUG ) {
		$this->logger->log(
			$level,
			sprintf( '%s %s', $method, $message ),
			array(
				'source' => 'jetpack-premium-analytics',
			)
		);
	}
}
