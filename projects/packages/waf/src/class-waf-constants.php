<?php
/**
 * Class use to define the constants used by the WAF
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

/**
 * Defines our constants.
 */
class Waf_Constants {
	/**
	 * Initializes the constants required for generating the bootstrap, if they have not been initialized yet.
	 *
	 * @return void
	 */
	public static function initialize_constants() {
		if ( ! defined( 'JETPACK_WAF_DIR' ) ) {
			define( 'JETPACK_WAF_DIR', trailingslashit( WP_CONTENT_DIR ) . 'jetpack-waf' );
		}
		if ( ! defined( 'JETPACK_WAF_WPCONFIG' ) ) {
			define( 'JETPACK_WAF_WPCONFIG', trailingslashit( WP_CONTENT_DIR ) . '../wp-config.php' );
		}
	}
}
