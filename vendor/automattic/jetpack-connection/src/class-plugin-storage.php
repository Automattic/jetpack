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

	const ACTIVE_PLUGINS_OPTION_NAME = 'jetpack_connection_active_plugins';

	/**
	 * Whether this class was configured for the first time or not.
	 *
	 * @var boolean
	 */
	private static $configured = false;

	/**
	 * Refresh list of connected plugins upon intialization.
	 *
	 * @var boolean
	 */
	private static $refresh_connected_plugins = false;

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

		// if plugin is not in the list of active plugins, refresh the list.
		if ( ! array_key_exists( $slug, get_option( self::ACTIVE_PLUGINS_OPTION_NAME, array() ) ) ) {
			self::$refresh_connected_plugins = true;
		}

		return true;
	}

	/**
	 * Retrieve the plugin information by slug.
	 * WARNING: the method cannot be called until Plugin_Storage::configure is called, which happens on plugins_loaded
	 * Even if you don't use Jetpack Config, it may be introduced later by other plugins,
	 * so please make sure not to run the method too early in the code.
	 *
	 * @param string $slug The plugin slug.
	 *
	 * @return array|null|WP_Error
	 */
	public static function get_one( $slug ) {
		$plugins = self::get_all();

		if ( $plugins instanceof WP_Error ) {
			return $plugins;
		}

		return empty( $plugins[ $slug ] ) ? null : $plugins[ $slug ];
	}

	/**
	 * Retrieve info for all plugins that use the connection.
	 * WARNING: the method cannot be called until Plugin_Storage::configure is called, which happens on plugins_loaded
	 * Even if you don't use Jetpack Config, it may be introduced later by other plugins,
	 * so please make sure not to run the method too early in the code.
	 *
	 * @return array|WP_Error
	 */
	public static function get_all() {
		$maybe_error = self::ensure_configured();

		if ( $maybe_error instanceof WP_Error ) {
			return $maybe_error;
		}

		return self::$plugins;
	}

	/**
	 * Remove the plugin connection info from Jetpack.
	 * WARNING: the method cannot be called until Plugin_Storage::configure is called, which happens on plugins_loaded
	 * Even if you don't use Jetpack Config, it may be introduced later by other plugins,
	 * so please make sure not to run the method too early in the code.
	 *
	 * @param string $slug The plugin slug.
	 *
	 * @return bool|WP_Error
	 */
	public static function delete( $slug ) {
		$maybe_error = self::ensure_configured();

		if ( $maybe_error instanceof WP_Error ) {
			return $maybe_error;
		}

		if ( array_key_exists( $slug, self::$plugins ) ) {
			unset( self::$plugins[ $slug ] );
		}

		return true;
	}

	/**
	 * The method makes sure that `Jetpack\Config` has finished, and it's now safe to retrieve the list of plugins.
	 *
	 * @return bool|WP_Error
	 */
	private static function ensure_configured() {
		if ( ! self::$configured ) {
			return new WP_Error( 'too_early', __( 'You cannot call this method until Jetpack Config is configured', 'jetpack' ) );
		}

		return true;
	}

	/**
	 * Called once to configure this class after plugins_loaded.
	 *
	 * @return void
	 */
	public static function configure() {

		if ( self::$configured ) {
			return;
		}

		// If a plugin was activated or deactivated.
		$number_of_plugins_differ = count( self::$plugins ) !== count( get_option( self::ACTIVE_PLUGINS_OPTION_NAME, array() ) );

		if ( $number_of_plugins_differ || true === self::$refresh_connected_plugins ) {
			self::update_active_plugins_option();
		}

		self::$configured = true;

	}

	/**
	 * Updates the active plugins option with current list of active plugins.
	 *
	 * @return void
	 */
	public static function update_active_plugins_option() {
		// Note: Since this options is synced to wpcom, if you change its structure, you have to update the sanitizer at wpcom side.
		update_option( self::ACTIVE_PLUGINS_OPTION_NAME, self::$plugins );
	}

}
