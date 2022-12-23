<?php
/**
 * Class use to define the constants used by the WAF
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Status\Host;

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
		if ( ! defined( 'DISABLE_JETPACK_WAF' ) ) {
			$is_wpcom  = defined( 'IS_WPCOM' ) && IS_WPCOM;
			$is_atomic = ( new Host() )->is_atomic_platform();
			define( 'DISABLE_JETPACK_WAF', $is_wpcom || $is_atomic );
		}
	}
}
