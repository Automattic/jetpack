<?php
/**
 * PublicizeAssets.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Assets;

/**
 * PublicizeAssets class.
 */
class Publicize_Assets {

	/**
	 * Initialize the class.
	 */
	public static function configure() {
		add_action( 'init', array( __CLASS__, 'register_assets' ) );
	}

	/**
	 * Register assets.
	 */
	public static function register_assets() {
		if ( ! wp_script_is( 'jetpack-publicize', 'registered' ) ) {

			Assets::register_script(
				'jetpack-publicize',
				'../build/jetpack-publicize.js',
				__FILE__,
				array(
					'in_footer'  => true,
					'textdomain' => 'jetpack-publicize-pkg',
				)
			);
		}
	}
}
