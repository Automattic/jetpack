<?php
/**
 * Test-only subclass of Plans_Abilities that overrides the current-plan fetch
 * seam so the success path can be exercised without round-tripping through the
 * option cache or a real Jetpack site connection.
 *
 * @package automattic/jetpack-plans
 */

use Automattic\Jetpack\Plans\Abilities\Plans_Abilities;

/**
 * Test-only subclass overriding Plans_Abilities's protected seam.
 *
 * The seam reads from a static fixture so tests can drive the ability
 * deterministically from inside the test method.
 */
class Plans_Abilities_Test_Stub extends Plans_Abilities {

	/**
	 * Seeded active plan returned by fetch_current_plan(); null falls through
	 * to the parent implementation (the option-backed lookup).
	 *
	 * @var array|null
	 */
	public static $current_plan = null;

	/**
	 * Reset fixtures to deterministic defaults.
	 *
	 * The first two parameters are retained for call-site compatibility but
	 * unused — only the active plan is stubbed now.
	 *
	 * @param mixed      $catalog       Unused.
	 * @param string     $site_suffix   Unused.
	 * @param array|null $current_plan  Seeded active plan (null => fall through to parent).
	 */
	public static function reset( $catalog = null, string $site_suffix = 'example.test', $current_plan = null ): void {
		unset( $catalog, $site_suffix );
		self::$current_plan = $current_plan;
	}

	protected static function fetch_current_plan(): array {
		if ( is_array( self::$current_plan ) ) {
			return self::$current_plan;
		}
		return parent::fetch_current_plan();
	}
}
