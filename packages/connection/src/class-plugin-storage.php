<?php
/**
 * Storage for plugin connection information.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Config;
use WP_Error;

/**
 * The class serves a single purpose - to store the data that plugins use the connection, along with some auxiliary information.
 * Well, we don't really store all that. The information is provided on runtime,
 * so all we need to do is to save the data into the class property and retrieve it from there on demand.
 *
 * @todo Adapt for multisite installations.
 */
class Plugin_Storage {

	/**
	 * Connected plugins.
	 *
	 * @var array
	 */
	private static $plugins = array();

	/**
	 * Whether the plugins were configured.
	 * To make sure we don't call the configuration process again and again.
	 *
	 * @var bool
	 */
	private static $plugins_configuration_finished = false;

	/**
	 * Add or update the plugin information in the storage.
	 *
	 * @param string $slug Plugin slug.
	 * @param array  $args Plugin arguments, optional.
	 *
	 * @return bool
	 */
	public static function upsert( $slug, array $args = array() ) {
		self::$plugins[ $slug ] = $args;

		return true;
	}

	/**
	 * Retrieve the plugin information by slug.
	 *
	 * @param string $slug The plugin slug.
	 *
	 * @return array|null
	 */
	public static function get_one( $slug ) {
		return empty( self::$plugins[ $slug ] ) ? null : self::$plugins[ $slug ];
	}

	/**
	 * Retrieve info for all plugins that use the connection.
	 * WARNING: the method cannot be called until Jetpack Config has been run (`plugins_loaded`, priority 2).
	 * Even if you don't use Jetpack Config, it may be introduced later by other plugins,
	 * so please make sure not to run the method too early in the code.
	 *
	 * @return array|WP_Error
	 */
	public static function get_all() {
		if ( class_exists( Config::class ) && method_exists( Config::class, 'is_configured' ) && ! Config::is_configured() ) {
			return new WP_Error( 'too_early', __( 'You cannot call this method until Jetpack Config is configured', 'jetpack' ) );
		}

		if ( ! self::$plugins_configuration_finished ) {
			/**
			 * Fires upon retrieval of the connected plugins.
			 * Only fires once, as the data isn't supposed to change after it's been initialized.
			 *
			 * @since 8.5.0
			 */
			do_action( 'jetpack_connection_configure_plugin' );

			self::$plugins_configuration_finished = true;
		}

		return self::$plugins;
	}

	/**
	 * Remove the plugin connection info from Jetpack.
	 *
	 * @param string $slug The plugin slug.
	 *
	 * @return bool
	 */
	public static function delete( $slug ) {
		if ( array_key_exists( $slug, self::$plugins ) ) {
			unset( self::$plugins[ $slug ] );
		}

		return true;
	}

}
