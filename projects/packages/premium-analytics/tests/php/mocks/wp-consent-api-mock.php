<?php
/**
 * Stands in for the WP Consent API plugin, which defines `wp_has_consent()` when active.
 *
 * @package automattic/jetpack-premium-analytics
 */

/**
 * Whether the visitor consented to a category.
 *
 * @param string $category Consent category.
 * @return bool
 */
function wp_has_consent( $category ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	return true;
}
