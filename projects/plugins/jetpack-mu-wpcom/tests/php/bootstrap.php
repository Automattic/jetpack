<?php
/**
 * Bootstrap.
 *
 * @package automattic/
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

\WorDBless\Load::load();
require_once __DIR__ . '/../../jetpack-mu-wpcom.php';

// Global function stubs that might be needed by all tests.

/**
 * Stub for the `is_automattician` function.
 *
 * This function is only used by the `class-errorreporting-activation-test.php`
 * test at the moment. It needs to be defined here because for some reason it's
 * not loaded by default globally in the test env,and since it's when the error
 * reporting php module is loaded, and since all modules are loaded here for
 * each test, defining it globally here is needed in order to not break the
 * tests due to it being undefined.
 *
 * Check the `class-errorreporting-activation-test.php` test to make sense
 * of the implementation here.
 *
 * @param int $user_id The user id.
 */
function is_automattician( $user_id ) {
	return ( 8898 === $user_id || 8808 === $user_id );
}
