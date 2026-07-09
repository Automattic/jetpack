<?php
/**
 * WooCommerce-free logger for the CSV report export pipeline.
 *
 * @package automattic/jetpack-premium-analytics
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging;

defined( 'ABSPATH' ) || exit;

use Throwable;

/**
 * Logs export pipeline messages through the PHP/WordPress error log.
 *
 * @since $$next-version$$
 */
class Error_Log_Logger implements Logger_Interface {

	/**
	 * Log source tag prepended to every line.
	 */
	private const SOURCE = 'jetpack-premium-analytics';

	/**
	 * Log an exception.
	 *
	 * @param Throwable $exception The exception to log.
	 * @param string    $method    The method where the exception occurred.
	 */
	public function log_exception( Throwable $exception, string $method ): void {
		$this->write( 'ERROR', $method, $exception->getMessage() );
	}

	/**
	 * Log an error.
	 *
	 * @param string $message The error message.
	 * @param string $method  The method where the error occurred.
	 */
	public function log_error( string $message, string $method ): void {
		$this->write( 'ERROR', $method, $message );
	}

	/**
	 * Log a generic note.
	 *
	 * @param string $message The note to log.
	 * @param string $method  The method where the note occurred.
	 */
	public function log_message( string $message, string $method ): void {
		$this->write( 'INFO', $method, $message );
	}

	/**
	 * Log a JSON response.
	 *
	 * @param mixed  $response The response to log.
	 * @param string $method   The method where the response occurred.
	 */
	public function log_response( $response, string $method ): void {
		$message = wp_json_encode( $response, JSON_UNESCAPED_SLASHES );
		$this->write( 'INFO', $method, false === $message ? '' : $message );
	}

	/**
	 * Write a single line to the error log.
	 *
	 * @param string $level   Log level tag.
	 * @param string $method  Originating method.
	 * @param string $message Message body.
	 * @return void
	 */
	private function write( string $level, string $method, string $message ): void {
		if ( ! ( defined( 'WP_DEBUG' ) && WP_DEBUG ) ) {
			return;
		}

		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			sprintf( '[%s] %s: %s %s', self::SOURCE, $level, $method, $message )
		);
	}
}
