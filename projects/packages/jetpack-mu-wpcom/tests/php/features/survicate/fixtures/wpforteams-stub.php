<?php
/**
 * Test stub: declare \WPForTeams\is_wpforteams_site so Survicate's P2 detection
 * exercises the WPForTeams branch. Loaded only inside isolated test processes.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace WPForTeams;

if ( ! function_exists( __NAMESPACE__ . '\\is_wpforteams_site' ) ) {
	/**
	 * @param int $blog_id Blog ID.
	 * @return bool
	 */
	function is_wpforteams_site( $blog_id ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return true;
	}
}
