<?php
/**
 * Test-only subclass of Subscribers_Dashboard_Abilities that overrides the
 * REST dispatch seam so callbacks can be exercised end-to-end without booting
 * the real REST server or hitting the WPCOM proxy.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Abilities\Subscribers_Dashboard_Abilities;

/**
 * Test double overriding the dispatch seam on Subscribers_Dashboard_Abilities.
 *
 * - Each test queues responses via `enqueue_response()`; calls pop from the
 *   queue in FIFO order so a single test can verify a per-item bulk delete
 *   sequence that mixes successes and failures.
 * - `last_request` captures the most recent dispatched WP_REST_Request so
 *   tests can assert the route and parameters passed through.
 */
class Subscribers_Dashboard_Abilities_Test_Stub extends Subscribers_Dashboard_Abilities {

	/**
	 * FIFO queue of seeded responses.
	 *
	 * @var array<int, array|\WP_Error>
	 */
	public static $responses = array();

	/**
	 * Number of dispatch() calls captured.
	 *
	 * @var integer
	 */
	public static $dispatch_calls = 0;

	/**
	 * The most recent dispatched request.
	 *
	 * @var \WP_REST_Request|null
	 */
	public static $last_request = null;

	/**
	 * Reset all captured state between tests.
	 */
	public static function reset(): void {
		self::$responses      = array();
		self::$dispatch_calls = 0;
		self::$last_request   = null;
	}

	/**
	 * Push a single response onto the queue.
	 *
	 * @param array|\WP_Error $response Response shape (array) or error.
	 */
	public static function enqueue_response( $response ): void {
		self::$responses[] = $response;
	}

	/**
	 * Override the dispatch seam: pop the next seeded response without touching
	 * the REST server. Falls through to an empty array if the test under-seeds.
	 *
	 * @param \WP_REST_Request $request Request that would have been dispatched.
	 *
	 * @return array|\WP_Error
	 */
	protected static function dispatch( \WP_REST_Request $request ) {
		++self::$dispatch_calls;
		self::$last_request = $request;

		if ( empty( self::$responses ) ) {
			return array();
		}
		return array_shift( self::$responses );
	}
}
