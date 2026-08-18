<?php
/**
 * Initialize the testing environment.
 *
 * @package automattic/jetpack-connection
 */

/**
 * Load the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Work around WordPress bug when `@runInSeparateProcess` is used.
if ( empty( $_SERVER['SCRIPT_FILENAME'] ) ) {
	$_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/vendor/phpunit/phpunit/phpunit';
}

if ( empty( $_SERVER['SCRIPT_NAME'] ) ) {
	$_SERVER['SCRIPT_NAME'] = __DIR__ . '/vendor/phpunit/phpunit/phpunit';
}

if ( empty( $_SERVER['PHP_SELF'] ) ) {
	$_SERVER['PHP_SELF'] = '';
}

// WordPress runs `_wp_cron()` on `shutdown`, handing this superglobal to
// `str_contains()`. CLI leaves it unset, and Mockery's strictly typed polyfill turns
// that into a fatal on PHP without a native `str_contains()`. Filling it in earlier
// would change what the tests see, so do it last: shutdown functions run in
// registration order, and WordPress registers its own later than this.
register_shutdown_function(
	function () {
		if ( ! isset( $_SERVER['REQUEST_URI'] ) ) {
			$_SERVER['REQUEST_URI'] = '/';
		}
	}
);

define( 'WP_DEBUG', true );

// Preloading the file to reconcile Brain\Monkey with Wordbless.
require_once __DIR__ . '/../../vendor/antecedent/patchwork/Patchwork.php';

require_once __DIR__ . '/CallableMock.php';

// Initialize WordPress test environment
\Automattic\Jetpack\Test_Environment::init();
require_once ABSPATH . WPINC . '/class-IXR.php';
