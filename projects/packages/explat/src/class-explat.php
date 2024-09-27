<?php
/**
 * Package description here
 *
 * @package automattic/jetpack-explat
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Rest_Authentication;
use Automattic\Jetpack\ExPlat\REST_Controller;

/**
 * Class description.
 */
class ExPlat {

	/**
	 * ExPlat package version
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.1.9';

	/**
	 * Initializer.
	 * Used to configure the ExPlat package
	 *
	 * @return void
	 */
	public static function init() {
		if ( did_action( 'jetpack_explat_initialized' ) ) {
			return;
		}

		// Set up the REST authentication hooks.
		Rest_Authentication::init();

		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ) );

		// Runs right after the Jetpack ExPlat package is initialized.
		do_action( 'jetpack_explat_initialized' );
	}
}
