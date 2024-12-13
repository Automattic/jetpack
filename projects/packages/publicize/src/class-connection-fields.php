<?php
/**
 * Publicize Connection Fields class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

/**
 * Publicize Connection Fields class.
 */
class Connection_Fields {

	/**
	 * Get the publicize instance - properly typed
	 *
	 * @return Publicize
	 */
	protected static function publicize() {
		/**
		 * Publicize instance.
		 *
		 * @var Publicize $publicize
		 */
		global $publicize;

		if ( ! $publicize && function_exists( 'publicize_init' ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunction - phan is dumb not to see the function_exists check
			publicize_init();
		}

		return $publicize;
	}

	/**
	 * Get the meta of a connection.
	 *
	 * @param array|object $connection The connection.
	 * @return array
	 */
	public static function get_connection_meta( $connection ) {

		return self::publicize()->get_connection_meta( $connection );
	}

	/**
	 * Get the ID of a connection.
	 *
	 * @param array $connection The connection.
	 * @return string
	 */
	public static function get_connection_id( $connection ) {
		return (string) self::publicize()->get_connection_id( $connection );
	}

	/**
	 * Returns a display name for the Connection
	 *
	 * @param string       $service_name 'facebook', 'twitter', etc.
	 * @param object|array $connection The Connection object (WordPress.com) or array (Jetpack).
	 * @return string
	 */
	public static function get_display_name( $service_name, $connection ) {
		return self::publicize()->get_display_name( $service_name, $connection );
	}

	/**
	 * Returns the external handle for the Connection.
	 *
	 * @param string       $service_name 'facebook', 'linkedin', etc.
	 * @param object|array $connection The Connection object (WordPress.com) or array (Jetpack).
	 * @return string
	 */
	public static function get_external_handle( $service_name, $connection ) {
		$cmeta = self::get_connection_meta( $connection );

		switch ( $service_name ) {
			case 'mastodon':
				return $cmeta['external_display'] ?? '';

			case 'bluesky':
			case 'threads':
				return $cmeta['external_name'] ?? '';

			case 'instagram-business':
				return $cmeta['connection_data']['meta']['username'] ?? '';

			default:
				return '';
		}
	}

	/**
	 * Returns the external ID for the Connection.
	 *
	 * @param object|array $connection The Connection object (WordPress.com) or array (Jetpack).
	 * @return string
	 */
	public static function get_external_id( $connection ) {
		$connection_meta = self::get_connection_meta( $connection );

		return $connection_meta['external_id'] ?? '';
	}

	/**
	 * Returns an external URL to the Connection's profile
	 *
	 * @param string       $service_name 'facebook', 'twitter', etc.
	 * @param object|array $connection The Connection object (WordPress.com) or array (Jetpack).
	 * @return false|string False on failure. URL on success.
	 */
	public static function get_profile_link( $service_name, $connection ) {
		return self::publicize()->get_profile_link( $service_name, $connection );
	}

	/**
	 * Returns a profile picture for the Connection
	 *
	 * @param object|array $connection The Connection object (WordPress.com) or array (Jetpack).
	 * @return string
	 */
	public static function get_profile_picture( $connection ) {
		return self::publicize()->get_profile_picture( $connection );
	}

	/**
	 * Returns a display name for the Service
	 *
	 * @param string $service_name 'facebook', 'twitter', etc.
	 * @return string
	 */
	public static function get_service_label( $service_name ) {
		return self::publicize()->get_service_label( $service_name );
	}

	/**
	 * Returns whether the Connection is shared
	 *
	 * @param array $connection The Connection object (WordPress.com) or array (Jetpack).
	 * @return bool
	 */
	public static function is_shared( $connection ) {
		return empty( self::get_user_id( $connection ) );
	}

	/**
	 * Returns the status for the Connection
	 *
	 * @param array $connection The Connection object (WordPress.com) or array (Jetpack).
	 * @return string
	 */
	public static function get_status( $connection ) {
		return $connection['status'] ?? 'ok';
	}

	/**
	 * Returns the user ID for the Connection
	 *
	 * @param array $connection The Connection object (WordPress.com) or array (Jetpack).
	 * @return int
	 */
	public static function get_user_id( $connection ) {
		$connection_meta = self::get_connection_meta( $connection );

		$connection_data = $connection_meta['connection_data'];

		return (int) $connection_data['user_id'];
	}
}
