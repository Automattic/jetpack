<?php
/**
 * The initializer class for the videopress package
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * Initialized the VideoPress package
 */
class Initializer {

	/**
	 * Invoke this method to initialize the VideoPress package
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! did_action( 'videopress_init' ) ) {
			new WPCOM_REST_API_V2_Endpoint_VideoPress();
		}
		/**
		 * Fires after the VideoPress package is initialized
		 *
		 * @since $$next-version$$
		 */
		do_action( 'videopress_init' );
	}
}
