<?php
/**
 * Test double implementing the export Logger_Interface.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\Logger_Interface;
use Throwable;

/**
 * No-op logger that records the messages it was given, for assertions in tests.
 */
class Spy_Logger implements Logger_Interface {

	/**
	 * Recorded log calls, each as [ 'level' => string, 'message' => string ].
	 *
	 * @var array[]
	 */
	public $entries = array();

	/**
	 * Record an exception.
	 *
	 * @param Throwable $exception The exception.
	 * @param string    $method    Calling method.
	 */
	public function log_exception( Throwable $exception, string $method ): void {
		$this->entries[] = array(
			'level'   => 'exception',
			'message' => $exception->getMessage(),
		);
	}

	/**
	 * Record an error.
	 *
	 * @param string $message The message.
	 * @param string $method  Calling method.
	 */
	public function log_error( string $message, string $method ): void {
		$this->entries[] = array(
			'level'   => 'error',
			'message' => $message,
		);
	}

	/**
	 * Record a message.
	 *
	 * @param string $message The message.
	 * @param string $method  Calling method.
	 */
	public function log_message( string $message, string $method ): void {
		$this->entries[] = array(
			'level'   => 'message',
			'message' => $message,
		);
	}

	/**
	 * Record a response.
	 *
	 * @param mixed  $response The response.
	 * @param string $method   Calling method.
	 */
	public function log_response( $response, string $method ): void {
		$this->entries[] = array(
			'level'   => 'response',
			'message' => is_scalar( $response ) ? (string) $response : wp_json_encode( $response, JSON_UNESCAPED_SLASHES ),
		);
	}
}
