<?php
/**
 * The class that provides information about VideoPress Status
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Jetpack;

/**
 * The class that provides information about VideoPress Status
 */
class Status {

	/**
	 * Returns whether VideoPress is active either as a Jetpack module or as a stand alone plugin
	 *
	 * @return boolean
	 */
	public static function is_active() {
		return self::is_jetpack_active() || self::is_standalone_plugin_active();
	}

	/**
	 * Returns whether the Jetpack plugin and its VideoPress module are active
	 *
	 * @return boolean
	 */
	public static function is_jetpack_active() {
		return class_exists( 'Jetpack' ) && Jetpack::is_module_active( 'videopress' );
	}

	/**
	 * Checks whether the VideoPress stand alone plugin is active
	 *
	 * @return boolean
	 */
	public static function is_standalone_plugin_active() {
		$possible_folders = array(
			'videopress', // monorepo.
			'jetpack-videopress', // production.
			'jetpack-videopress-dev', // Jetpack Beta.
		);
		foreach ( $possible_folders as $folder ) {
			if ( is_plugin_active( $folder . '/jetpack-videopress.php' ) ) {
				return true;
			}
		}
		return false;
	}
}
