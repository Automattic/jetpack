<?php
/**
 * Storage for plugin connection information.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * Storage for plugin connection information.
 *
 * @todo Adapt for multisite installations.
 */
class Plugin_Storage {

	const OPTION_KEY = 'connection_plugins';

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
	 *
	 * @return array
	 */
	public static function get_all() {
		if ( ! self::$plugins_configuration_finished ) {
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
