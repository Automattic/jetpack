<?php
/**
 * Logger contract for the CSV report export pipeline.
 *
 * @package automattic/jetpack-premium-analytics
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging;

defined( 'ABSPATH' ) || exit;

use Throwable;

/**
 * Logger contract for the report-export subsystem.
 *
 * @since $$next-version$$
 */
interface Logger_Interface {
	/**
	 * Log an exception.
	 *
	 * @param Throwable $exception The exception to log.
	 * @param string    $method    The method where the exception occurred.
	 */
	public function log_exception( Throwable $exception, string $method ): void;

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
