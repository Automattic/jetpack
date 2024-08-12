<?php
/**
 * Publicize_Assets.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Assets;

/**
 * Publicize_Assets class.
 */
class Publicize_Assets {

	/**
	 * Initialize the class.
	 */
	public static function configure() {
		add_action( 'wp_loaded', array( __CLASS__, 'register_assets' ) );

		Publicize_Script_Data::configure();
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
