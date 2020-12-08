<?php
/**
 * The Backward Compatibility class.
 *
 * @package automattic/jetpack-back
 */

namespace Automattic\Jetpack\Back;

/**
 * The class manages the features supported by the plugins.
 */
class Compatibility {

	/**
	 * Supported features are stored here on per-plugin basis.
	 *
	 * @var array
	 */
	private static $features = array();

	/**
	 * Mark a feature as supported by the plugin.
	 *
	 * @param string $plugin The plugin slug.
	 * @param string $feature The feature label.
	 */
	public static function add_feature( $plugin, $feature ) {
		if ( ! array_key_exists( $plugin, static::$features ) || ! is_array( static::$features[ $plugin ] ) ) {
			static::$features[ $plugin ] = array();
		}

		if ( ! in_array( $feature, static::$features[ $plugin ], true ) ) {
			static::$features[ $plugin ][] = $feature;
		}
	}

	/**
	 * Check if all the plugins support a feature.
	 *
	 * @param string $feature The feature label.
	 *
	 * @return bool True if the feature is supported, false otherwise.
	 */
	public static function can_use( $feature ) {
		foreach ( static::$features as $features ) {
			if ( ! in_array( $feature, $features, true ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Let the package know that the plugin exists and needs to be checked for compatibility.
	 *
	 * @param string $plugin The plugin slug.
	 */
	public static function add_plugin( $plugin ) {
		if ( empty( static::$features[ $plugin ] ) || ! is_array( static::$features[ $plugin ] ) ) {
			static::$features[ $plugin ] = array();
		}
	}

}
