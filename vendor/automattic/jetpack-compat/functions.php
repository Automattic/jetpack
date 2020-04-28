<?php
/**
 * Legacy global scope functions.
 *
 * @package automattic/jetpack-compat
 */

if ( ! defined( 'ABSPATH' ) ) {
	return;
}

// Add here, after the condition above, any code that should only run when WordPress is running.
// Autoload will load everything even when PHPCS is running and we don't want to run these
// in such case because they will fatal, for example, due to 'add_action' being undefined.

/**
 * Load necessary functions.
 */
function jetpack_compat_require_defined_functions() {
	require_once __DIR__ . '/lib/tracks/client.php';
}

add_action( 'plugins_loaded', 'jetpack_compat_require_defined_functions' );
