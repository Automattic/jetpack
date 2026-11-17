<?php
/**
 * @package automattic/jetpack-seo
 */

/** Supplies the Simple plan in isolated tests. */
class WPCOM_Store_API {
	/**
	 * @var array Current Simple plan.
	 */
	public static $plan = array();

	/**
	 * @param int $blog_id Site ID.
	 * @return array
	 */
	public static function get_current_plan( $blog_id = 0 ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Match the host API signature.
		return self::$plan;
	}
}
