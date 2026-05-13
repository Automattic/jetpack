<?php
/**
 * Test-only subclass of Post_By_Email_Abilities that overrides the protected
 * seams (user-connection check, remote address fetch, remote regenerate apply)
 * so the success path can be exercised without a Jetpack token fixture or live
 * IXR endpoint.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Plugin\Abilities\Post_By_Email_Abilities;

/**
 * Test-only subclass overriding Post_By_Email_Abilities's protected seams.
 *
 * - is_user_connected_to_jetpack(): always true.
 * - fetch_address(): returns the seeded address (string|null).
 * - apply_regenerate(): returns the seeded next address (string|WP_Error) and
 *   records each call instead of hitting IXR.
 */
class Post_By_Email_Abilities_Test_Stub extends Post_By_Email_Abilities {

	/**
	 * Seeded remote address for fetch_address().
	 *
	 * @var string|null
	 */
	public static $current_address = null;

	/**
	 * Seeded next address for apply_regenerate(). When `null` the stub mints a
	 * deterministic placeholder that differs from $current_address so callers
	 * can assert "new != old" without seeding both fields manually.
	 *
	 * @var string|null|\WP_Error
	 */
	public static $next_address = null;

	/**
	 * Number of apply_regenerate() calls in the current test.
	 *
	 * @var int
	 */
	public static $apply_calls = 0;

	/**
	 * Reset test-double state and seed the simulated remote state.
	 *
	 * @param string|null           $current_address Simulated current address.
	 * @param string|null|\WP_Error $next_address    Simulated next address from regenerate.
	 */
	public static function reset( $current_address = null, $next_address = null ): void {
		self::$current_address = $current_address;
		self::$next_address    = $next_address;
		self::$apply_calls     = 0;
	}

	/**
	 * Always-connected for tests — bypasses the real Connection_Manager check.
	 */
	protected static function is_user_connected_to_jetpack(): bool {
		return true;
	}

	/**
	 * Return the seeded simulated remote address.
	 *
	 * @return string|null
	 */
	protected static function fetch_address() {
		return self::$current_address;
	}

	/**
	 * Record the call and return the seeded next address (or a deterministic
	 * placeholder that differs from the current address).
	 *
	 * @return string|\WP_Error
	 */
	protected static function apply_regenerate() {
		++self::$apply_calls;

		if ( self::$next_address instanceof \WP_Error ) {
			return self::$next_address;
		}

		$new = self::$next_address;
		if ( null === $new ) {
			$base = is_string( self::$current_address ) && '' !== self::$current_address
				? self::$current_address
				: 'pbe-original@example.test';
			$new  = 'pbe-rotated-' . self::$apply_calls . '@example.test';
			// Defensive: if a caller seeded a current address equal to the
			// placeholder, perturb so the assertion "new !== old" is meaningful.
			if ( $new === $base ) {
				$new = 'pbe-rotated-alt-' . self::$apply_calls . '@example.test';
			}
		}

		self::$current_address = $new;
		return $new;
	}
}
