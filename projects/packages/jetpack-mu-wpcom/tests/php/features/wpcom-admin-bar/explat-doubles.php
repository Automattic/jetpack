<?php
/**
 * Test doubles for the wpcom-only \ExPlat\ helpers.
 *
 * Loaded by Free_Domain_Upsell_Test.php. Kept in a separate file so the test
 * file holds a single class in the global namespace.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace ExPlat;

if ( ! function_exists( 'ExPlat\assign_current_user' ) ) {
	/**
	 * Test double for the wpcom-only assigning ExPlat call.
	 *
	 * @param string $experiment_name The experiment name.
	 * @return string|null
	 */
	function assign_current_user( string $experiment_name ): ?string {
		$GLOBALS['explat_assign_calls'][] = $experiment_name;
		return $GLOBALS['explat_assign_return'] ?? null;
	}
}

if ( ! function_exists( 'ExPlat\get_current_user_assignment' ) ) {
	/**
	 * Test double for the wpcom-only non-assigning ExPlat read.
	 *
	 * @param string $experiment_name The experiment name.
	 * @return string|null
	 */
	function get_current_user_assignment( string $experiment_name ): ?string {
		$GLOBALS['explat_read_calls'][] = $experiment_name;
		return $GLOBALS['explat_read_return'] ?? null;
	}
}
