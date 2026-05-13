<?php
/**
 * Test-only subclass of Blaze_Abilities that overrides the protected seams
 * (site ID resolution, WPCOM request transport, Blaze::site_supports_blaze)
 * so the execute paths can be exercised without standing up a live connection
 * or remote DSP fixture.
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze\Abilities;

use WP_Error;

/**
 * Test-only subclass overriding Blaze_Abilities's protected seams.
 *
 * - `get_site_id()` returns the seeded `$site_id`.
 * - `wpcom_request_as_user()` returns either `$response_error` (if set), the
 *   `$path_responses` entry that matches the requested path, or `$response`.
 * - `Blaze::site_supports_blaze()` is short-circuited via the path-responses
 *   table — the dashboard summary always calls the credits + campaigns paths.
 */
class Blaze_Abilities_Test_Stub extends Blaze_Abilities {

	/**
	 * Seeded site ID returned by the stubbed `get_site_id()`.
	 *
	 * @var int
	 */
	public static $site_id = 1;

	/**
	 * Default seeded WPCOM response (used when `$path_responses` doesn't match).
	 *
	 * @var array
	 */
	public static $response = array();

	/**
	 * Per-path response table. When set, the stub looks up the response by exact
	 * path-prefix match before falling back to `$response`. The matching uses
	 * `str_contains` (not full equality) so query strings can be appended without
	 * forcing every test to know the exact wire format.
	 *
	 * @var array<string, array>
	 */
	public static $path_responses = array();

	/**
	 * If set, return this WP_Error from every wpcom_request_as_user() call
	 * (unless overridden by a matching $path_responses entry).
	 *
	 * @var WP_Error|null
	 */
	public static $response_error = null;

	/**
	 * Last path passed to wpcom_request_as_user(). Lets tests assert on the
	 * wire-format used by the abilities.
	 *
	 * @var string
	 */
	public static $last_path = '';

	/**
	 * Seeded value returned from the `site_supports_blaze` path; tests for
	 * `get_dashboard_summary` use this to short-circuit the live blaze-status
	 * check.
	 *
	 * @var bool
	 */
	public static $site_supports = true;

	/**
	 * Reset test-double state. Call from set_up() and tear_down().
	 */
	public static function reset(): void {
		self::$site_id        = 1;
		self::$response       = array();
		self::$path_responses = array();
		self::$response_error = null;
		self::$last_path      = '';
		self::$site_supports  = true;

		// Reset the Blaze site_supports_blaze cache between tests so each test sees
		// a consistent value. We re-seed via filter rather than mocking the static.
		remove_all_filters( 'jetpack_blaze_dashboard_enable' );
	}

	/**
	 * Returns the seeded site ID — bypasses the real Connection_Manager lookup.
	 */
	protected static function get_site_id() {
		return self::$site_id;
	}

	/**
	 * Returns the seeded `site_supports` flag — bypasses the live WPCOM eligibility check.
	 *
	 * @param int $site_id Ignored.
	 * @return bool
	 */
	protected static function site_supports_blaze( int $site_id ): bool {
		unset( $site_id );
		return self::$site_supports;
	}

	/**
	 * Returns the seeded response or error — bypasses real WPCOM transport.
	 *
	 * @param string $path WPCOM REST path.
	 * @return array|WP_Error
	 */
	protected static function wpcom_request_as_user( string $path ) {
		self::$last_path = $path;

		// Per-path lookup wins over default response, but only for paths in the table.
		foreach ( self::$path_responses as $needle => $resp ) {
			if ( str_contains( $path, $needle ) ) {
				return $resp;
			}
		}

		if ( null !== self::$response_error ) {
			return self::$response_error;
		}

		return self::$response;
	}
}
