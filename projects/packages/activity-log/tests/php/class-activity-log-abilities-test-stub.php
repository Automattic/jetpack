<?php
/**
 * Test-only subclass of Activity_Log_Abilities that overrides the protected
 * dispatch seam so the success path can be exercised without standing up the
 * WPCOM proxy or a Jetpack connection.
 *
 * @package automattic/jetpack-activity-log
 */

use Automattic\Jetpack\Activity_Log\Abilities\Activity_Log_Abilities;

/**
 * Test-only subclass overriding Activity_Log_Abilities's dispatch seam.
 *
 * - dispatch_list_request(): returns the seeded payload from ::seed(),
 *   or a WP_Error when ::seed_error() was called.
 * - $last_request: captures the WP_REST_Request the ability built so
 *   tests can assert how input was forwarded to the upstream proxy.
 */
class Activity_Log_Abilities_Test_Stub extends Activity_Log_Abilities {

	/**
	 * Seeded WPCOM response. Returned from dispatch_list_request().
	 *
	 * @var array
	 */
	public static $seeded_response = array();

	/**
	 * Seeded WP_Error. When set, dispatch_list_request() returns it directly.
	 *
	 * @var \WP_Error|null
	 */
	public static $seeded_error = null;

	/**
	 * The last request dispatch_list_request() was called with. Useful for
	 * asserting input -> upstream param mapping.
	 *
	 * @var \WP_REST_Request|null
	 */
	public static $last_request = null;

	/**
	 * Reset all test-double state and seed a happy-path response.
	 *
	 * @param array $response Seeded WPCOM-shaped response.
	 */
	public static function seed( array $response ): void {
		self::$seeded_response = $response;
		self::$seeded_error    = null;
		self::$last_request    = null;
	}

	/**
	 * Seed an error to be returned by dispatch_list_request().
	 *
	 * @param \WP_Error $error Error to return.
	 */
	public static function seed_error( \WP_Error $error ): void {
		self::$seeded_response = array();
		self::$seeded_error    = $error;
		self::$last_request    = null;
	}

	/**
	 * Override the dispatch seam to return the seeded response without
	 * calling the WPCOM proxy.
	 *
	 * @param \WP_REST_Request $request The request the ability built.
	 * @return array|\WP_Error
	 */
	protected static function dispatch_list_request( \WP_REST_Request $request ) {
		self::$last_request = $request;
		if ( self::$seeded_error instanceof \WP_Error ) {
			return self::$seeded_error;
		}
		return self::$seeded_response;
	}
}
