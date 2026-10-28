<?php
/**
 * Archive canonical tags on WordPress.com Simple.
 *
 * Elsewhere Jetpack loads the `canonical-urls` module itself. Simple runs no modules, so its
 * switch is a plain option and the package loads the module file when it is on.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Host;

/**
 * Loads the Jetpack `canonical-urls` module on Simple sites that switched it on.
 */
class Canonical_Urls {

	/**
	 * Simple's on/off switch; missing means off. WordPress.com maps it to the
	 * `canonical-urls` module when a site moves to Atomic, so keep the name.
	 *
	 * @var string
	 */
	const OPTION = 'jetpack_canonical_urls_enabled';

	/**
	 * On Simple with the switch on, load the module on the hook Jetpack loads modules on.
	 *
	 * @return void
	 */
	public static function init() {
		if ( ( new Host() )->is_wpcom_simple() && self::is_enabled() ) {
			add_action( 'after_setup_theme', array( __CLASS__, 'load_module' ) );
		}
	}

	/**
	 * Whether Simple's switch is on.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return (bool) get_option( self::OPTION, false );
	}

	/**
	 * Load the module file, which prints the tag and applies its own conflict filter.
	 *
	 * @return void
	 */
	public static function load_module() {
		$dir = Constants::get_constant( 'JETPACK__PLUGIN_DIR' );
		if ( $dir ) {
			require_once $dir . 'modules/canonical-urls.php';
		}
	}
}
