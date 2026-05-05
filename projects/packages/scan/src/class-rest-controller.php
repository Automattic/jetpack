<?php
/**
 * REST controller stub for the Jetpack Scan package.
 *
 * Routes are added by the follow-up Scan dashboard port. This empty
 * stub keeps `Jetpack_Scan::register_rest_routes()` callable while the
 * wp-build dashboard scaffold is the only thing shipping.
 *
 * @package automattic/jetpack-scan-page
 */

namespace Automattic\Jetpack\Scan_Page;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class REST_Controller
 */
class REST_Controller {

	/**
	 * Registers the REST routes backing the Scan UI.
	 */
	public static function register_rest_routes() {
		// No-op. Routes land with the dashboard port.
	}
}
