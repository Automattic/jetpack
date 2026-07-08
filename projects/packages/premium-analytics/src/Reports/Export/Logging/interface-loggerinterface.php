<?php
/**
 * Logger contract for the CSV report export pipeline.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging;

use Exception;

interface LoggerInterface {
	/**
	 * Log an exception.
	 *
	 * @param Exception $exception The exception to log.
	 * @param string    $method    The method where the exception occurred.
	 */
	public function log_exception( Exception $exception, string $method ): void;

	/**
	 * Log an error.
	 *
	 * @param string $message The error message.
	 * @param string $method  The method where the error occurred.
	 */
	public function log_error( string $message, string $method ): void;

	/**
	 * Log a generic note.
	 *
	 * @param string $message The note to log.
	 * @param string $method  The method where the note occurred.
	 */
	public function log_message( string $message, string $method ): void;

	/**
	 * Log a JSON response.
	 *
	 * @param mixed  $response The response to log.
	 * @param string $method   The method where the response occurred.
	 */
	public function log_response( $response, string $method ): void;
}
