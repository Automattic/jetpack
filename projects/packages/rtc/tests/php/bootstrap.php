<?php
/**
 * Bootstrap.
 *
 * @package automattic/jetpack-rtc
 */

/**
 * Include the composer autoloader.
 */
require_once __DIR__ . '/../../vendor/autoload.php';

// Initialize WordPress test environment.
\Automattic\Jetpack\Test_Environment::init();

// get_wpcom_blog_id() lives in jetpack-mu-wpcom which is not a dependency of
// this package. Provide a minimal stub so tests can control the return value
// via the 'wpcom_blog_id_stub' option.
if ( ! function_exists( 'get_wpcom_blog_id' ) ) {
	/**
	 * Stub for get_wpcom_blog_id() used in tests.
	 *
	 * @return int|false
	 * @phan-suppress PhanRedefineFunction Phan doesn't evaluate function_exists() guards; this stub is only active when the real function is absent.
	 */
	function get_wpcom_blog_id() {
		$id = get_option( 'wpcom_blog_id_stub', false );
		return $id ? (int) $id : false;
	}
}
