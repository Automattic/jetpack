<?php
/**
 * Test stub for the jetpack-plans package's Current_Plan class.
 *
 * The real class lives in projects/packages/plans, which the SEO package does not
 * depend on, so it isn't autoloaded in the package test context. Initializer guards
 * on it with method_exists(), so this controllable stand-in lets tests drive the
 * plan gating. Tests set the public static property.
 *
 * Defaults to supporting `advanced-seo` (i.e. UNGATED) so that merely loading this
 * stub doesn't change the outcome of tests that aren't about gating.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack;

if ( ! class_exists( __NAMESPACE__ . '\\Current_Plan' ) ) {

	/**
	 * Stub of the jetpack-plans package's Current_Plan.
	 */
	class Current_Plan {

		/**
		 * Feature slugs this stubbed plan reports support for.
		 *
		 * @var string[]
		 */
		public static $supported = array( 'advanced-seo' );

		/**
		 * Stub for the real plan-feature check.
		 *
		 * @param string $feature            Feature slug.
		 * @param bool   $refresh_from_wpcom Unused; present to match the real signature.
		 * @return bool
		 */
		public static function supports( $feature, $refresh_from_wpcom = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			return in_array( $feature, self::$supported, true );
		}
	}
}
