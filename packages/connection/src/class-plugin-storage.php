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
 * @todo Consider using the `Jetpack_Options` package.
 */
class Plugin_Storage {

	const OPTION_KEY = 'connection_plugins';

	/**
	 * Add or update the plugin information in the storage.
	 *
	 * @param string $slug Plugin slug.
	 * @param array  $args Plugin arguments, optional.
	 *
	 * @return bool
	 *
	 * @todo Don't update if nothing's changed
	 */
	public static function upsert( $slug, array $args = array() ) {
		$stored          = self::get_all();
		$stored[ $slug ] = $args;

		update_option( self::OPTION_KEY, $stored, false );

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
		$stored = self::get_all();

		return empty( $stored[ $slug ] ) ? null : $stored[ $slug ];
	}

	/**
	 * Retrieve info for all plugins that use the connection.
	 *
	 * @return array
	 */
	public static function get_all() {
		return get_option( self::OPTION_KEY, array() );
	}

	/**
	 * Remove the plugin connection info from Jetpack.
	 *
	 * @param string $slug The plugin slug.
	 *
	 * @return bool
	 */
	public static function delete( $slug ) {
		$stored = self::get_all();

		if ( array_key_exists( $slug, $stored ) ) {
			unset( $stored[ $slug ] );
		}

		return update_option( self::OPTION_KEY, $stored, false );
	}

}
