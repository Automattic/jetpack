<?php
/**
 * Global stub so Dashboard::set_module_translations()'s
 * `function_exists( 'wp_set_script_module_translations' )` guard passes on
 * WordPress < 7.0 test environments (the API is WordPress 7.0+).
 *
 * @package automattic/jetpack-forms
 */

if ( ! function_exists( 'wp_set_script_module_translations' ) ) {
	/**
	 * No-op stand-in for the WordPress 7.0 API.
	 *
	 * @param string $id     Script module id.
	 * @param string $domain Text domain.
	 * @param string $path   Optional path.
	 * @return bool
	 */
	function wp_set_script_module_translations( $id, $domain = 'default', $path = '' ) { // phpcs:ignore Universal.NamingConventions.NoReservedKeywordParameterNames.pathFound, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return true;
	}
}
