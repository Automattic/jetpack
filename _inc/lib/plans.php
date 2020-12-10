<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Plans Library
 *
 * @deprecated 9.3.0
 *
 * Fetch plans data from WordPress.com.
 *
 * Not to be confused with the `Jetpack_Plan` (singular)
 * class, which stores and syncs data about the site's _current_ plan.
 *
 * @package Jetpack
 */
class Jetpack_Plans {
	/**
	 * Get a list of all available plans from WordPress.com
	 *
	 * @deprecated 9.3.0
	 *
	 * @since 7.7.0
	 *
	 * @return array The plans list
	 */
	public static function get_plans() {
		_deprecated_function( __METHOD__, 'jetpack-9.3.0', '' );
		return array();
	}

	/**
	 * Get plan information for a plan given its slug
	 *
	 * @deprecated 9.3.0
	 *
	 * @since 7.7.0
	 *
	 * @param string $plan_slug Plan slug.
	 *
	 * @return void|object The plan object
	 */
	public static function get_plan( $plan_slug ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		_deprecated_function( __METHOD__, 'jetpack-9.3.0', '' );
	}
}
