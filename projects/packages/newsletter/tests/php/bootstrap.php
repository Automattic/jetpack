<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-newsletter
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

define( 'WP_DEBUG', true );

\Automattic\Jetpack\Test_Environment::init();

if ( ! function_exists( 'is_automattician' ) ) {
	/**
	 * Test stub for the WordPress.com-global `is_automattician()`, which only
	 * exists on Simple sites and is therefore absent from the package test
	 * runtime. Tests toggle the return value per case via the
	 * `$GLOBALS['jetpack_newsletter_test_is_automattician']` flag (defaults to
	 * false), and reset it in tear down so the stub stays inert elsewhere.
	 *
	 * @param int|false $user_id Unused; mirrors the wpcom signature.
	 * @return bool
	 */
	function is_automattician( $user_id = false ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- mirrors the wpcom global signature.
		return ! empty( $GLOBALS['jetpack_newsletter_test_is_automattician'] );
	}
}
