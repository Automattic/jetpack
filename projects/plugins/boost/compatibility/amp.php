<?php
/**
 * Compatibility for AMP.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Compatibility\Amp;

use Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\Critical_CSS;

/**
 * Class AMP.
 */
class Amp {
	/**
	 * Critical_CSS module instance.
	 *
	 * @var Critical_CSS
	 */
	private static $critical_css;

	/**
	 * Init AMP compatibility actions after modules are initialized.
	 *
	 * @param Critical_CSS $module Critical_CSS Module instance.
	 */
	public static function init_compatibility( $module ) {
		self::$critical_css = $module;

		add_action( 'wp', array( __CLASS__, 'disable_critical_css' ), 0 );
	}

	/**
	 * Disable Critical CSS display.
	 */
	public static function disable_critical_css() {
		if ( amp_is_request() ) {
			remove_action( 'wp', array( self::$critical_css, 'display_critical_css' ) );
		}
	}
}

add_action( 'jetpack_boost_critical-css_initialized', array( __NAMESPACE__ . '\Amp', 'init_compatibility' ) );
