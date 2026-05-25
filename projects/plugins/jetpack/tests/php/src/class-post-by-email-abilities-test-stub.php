<?php
/**
 * Test-only subclass of Post_By_Email_Abilities that overrides the protected
 * seams (user-connection check, remote address fetch, remote write apply) so
 * the success path can be exercised without a Jetpack token fixture or live
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
 * - apply_action(): returns the seeded next address (string|WP_Error) and
 *   records each call (plus the chosen action) instead of hitting IXR.
 */
class Post_By_Email_Abilities_Test_Stub extends Post_By_Email_Abilities {

	/**
	 * Seeded remote address for fetch_address().
	 *
	 * @var string|null
	 */
	public static $current_address = null;

	/**
	 * Seeded next address for apply_action(). When `null` the stub mints a
	 * deterministic placeholder that differs from $current_address so callers
	 * can assert "new != old" without seeding both fields manually.
	 *
	 * @var string|null|\WP_Error
	 */
	public static $next_address = null;

	/**
	 * Number of apply_action() calls in the current test.
	 *
	 * @var int
	 */
	public static $apply_calls = 0;

	/**
	 * Action strings ('create' / 'regenerate') recorded in call order, so
	 * tests can assert the create-vs-regenerate routing.
	 *
	 * @var array<int, string>
	 */
	public static $apply_actions = array();

	/**
	 * Reset test-double state and seed the simulated remote state.
	 *
	 * @param string|null           $current_address Simulated current address.
	 * @param string|null|\WP_Error $next_address    Simulated next address from apply_action.
	 */
	public static function reset( $current_address = null, $next_address = null ): void {
		self::$current_address = $current_address;
		self::$next_address    = $next_address;
		self::$apply_calls     = 0;
		self::$apply_actions   = array();
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
	 * Record the call (and chosen action) and return the seeded next address
	 * (or a deterministic placeholder that differs from the current address).
	 *
	 * @param string $action 'create' or 'regenerate' — recorded for assertions.
	 * @return string|\WP_Error
	 */
	protected static function apply_action( string $action ) {
		++self::$apply_calls;
		self::$apply_actions[] = $action;

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
