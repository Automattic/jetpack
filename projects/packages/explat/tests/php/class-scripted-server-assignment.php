<?php
/**
 * Test double for Server_Assignment.
 *
 * @package automattic/jetpack-explat
 */

use Automattic\Jetpack\ExPlat\Server_Assignment;

/**
 * A Server_Assignment whose ExPlat lookup is scripted, so the caching contract
 * can be tested without a Simple site or a connection.
 */
class Scripted_Server_Assignment extends Server_Assignment {

	/**
	 * Variations to return, one per call.
	 *
	 * @var array
	 */
	public static $answers = array();

	/**
	 * Calls made to fetch_variation().
	 *
	 * @var int
	 */
	public static $calls = 0;

	/**
	 * @param string $experiment_name The experiment to read.
	 * @param array  $args            As passed to get_variation().
	 * @return string|null
	 */
	protected static function fetch_variation( $experiment_name, $args ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- The script ignores both.
		++self::$calls;

		return array_shift( self::$answers );
	}
}
