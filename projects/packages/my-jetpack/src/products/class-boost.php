<?php
/**
 * Boost product
 *
 * @package my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack\Products;

/**
 * Class responsible for handling the Boost product
 */
class Boost {

	const PLUGIN_FILENAME = 'boost/jetpack-boost.php';

	/**
	 * Get the Product info for the API
	 *
	 * @return array
	 */
	public static function get_info() {
		if ( self::is_active() ) {
			$status = 'active';
		} elseif ( ! self::is_plugin_installed() ) {
			$status = 'plugin_absent';
		} else {
			$status = 'inactive';
		}
		return array(
			'slug'        => 'boost',
			'description' => __( 'Instant speed and SEO', 'jetpack-my-jetpack' ),
			'name'        => __( 'Boost', 'jetpack-my-jetpack' ),
			'status'      => $status,
			'class'       => __CLASS__,
		);
	}

	/**
	 * Checks whether the Product is active
	 *
	 * @return boolean
	 */
	public static function is_active() {
		return self::is_plugin_active();
	}

	/**
	 * Checks whether the plugin is installed
	 *
	 * @return boolean
	 */
	public static function is_plugin_installed() {
		$all_plugins = get_plugins();
		return array_key_exists( self::PLUGIN_FILENAME, $all_plugins );
	}

	/**
	 * Checks whether the plugin is active
	 *
	 * @return boolean
	 */
	public static function is_plugin_active() {
		return is_plugin_active( self::PLUGIN_FILENAME );
	}

	/**
	 * Activates the plugin (in the future also intall the plugin if needed)
	 *
	 * @return boolean|\WP_Error
	 */
	public static function activate() {
		// TODO - extract lib/plugins.php from Jetpack in order to install. For now this will only activate the already installed plugin.
		$result = activate_plugin( self::PLUGIN_FILENAME );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		return is_null( $result );
	}

	/**
	 * Deactivate the plugin
	 *
	 * @return boolean
	 */
	public static function deactivate() {
		deactivate_plugins( self::PLUGIN_FILENAME );
		return true;
	}
}
