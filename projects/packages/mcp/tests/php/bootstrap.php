<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-mcp
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

/**
 * Mock WordPress translation function for testing.
 */
if ( ! function_exists( '__' ) ) {
	/**
	 * Mock translation function.
	 *
	 * @param string $text Text to translate.
	 * @param string $domain Text domain.
	 * @return string
	 */
	/** @phan-suppress-next-line PhanRedefineFunction */
	function __( $text, $domain = 'default' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $domain is required for WordPress function signature
		return $text;
	}
}

/**
 * Mock WordPress apply_filters function for testing.
 */
if ( ! function_exists( 'apply_filters' ) ) {
	/**
	 * Mock apply_filters function.
	 *
	 * @param string $tag Filter name.
	 * @param mixed  $value Value to filter.
	 * @param mixed  ...$args Additional arguments.
	 * @return mixed
	 */
	/** @phan-suppress-next-line PhanRedefineFunction */
	function apply_filters( $tag, $value, ...$args ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- $args is required for WordPress function signature
		return $value;
	}
}
