<?php
/**
 * Transients for Jetpack Boost.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Class Transient
 */
class Transient {

	const OPTION_PREFIX = 'jb_transient_';

	/**
	 * Get the key with prefix.
	 *
	 * @param string $key the key to be prefixed.
	 */
	public static function key( $key ) {
		return static::OPTION_PREFIX . $key;
	}

	/**
	 * Updates a cache entry. Creates the cache entry if it doesn't exist.
	 *
	 * @param string $key    Cache key name.
	 * @param mixed  $value  Cache value.
	 * @param int    $expiry Cache expiration in seconds.
	 *
	 * @return void
	 */
	public static function set( $key, $value, $expiry = 0 ) {
		if ( 0 === $expiry ) {
			$expiry = YEAR_IN_SECONDS;
		}

		$data = array(
			'expire' => time() + $expiry,
			'data'   => $value,
		);
		update_option( self::key( $key ), $data, false );
	}

	/**
	 * Gets a cache entry.
	 *
	 * @param string $key     Cache key name.
	 * @param mixed  $default Default value.
	 *
	 * @return mixed
	 */
	public static function get( $key, $default = null ) {
		// Ensure everything's there.
		$option = get_option( self::key( $key ), $default );
		if ( $default === $option || ! isset( $option['expire'] ) || ! isset( $option['data'] )
		) {
			return $default;
		}

		// Maybe expire the result instead of returning it.
		$expire = $option['expire'];
		$data   = $option['data'];
		if ( false !== $expire && $expire < time() ) {
			self::delete( $key );

			return $default;
		}

		return $data;
	}

	/**
	 * Delete all `Transient` values with certain prefix from database.
	 *
	 * @param string $prefix Cache key prefix.
	 */
	public static function delete_by_prefix( $prefix ) {
		global $wpdb;

		/**
		 * The prefix used in option_name.
		 */
		$option_prefix = static::key( $prefix );

		/**
		 * LIKE search pattern for the delete query.
		 */
		$prefix_search_pattern = $wpdb->esc_like( $option_prefix ) . '%';

		$wpdb->query(
			$wpdb->prepare(
				"
					DELETE
					FROM    $wpdb->options
					WHERE   `option_name` LIKE %s
				",
				$prefix_search_pattern
			)
		);
	}

	/**
	 * Delete a cache entry.
	 *
	 * @param string $key Cache key name.
	 *
	 * @return void
	 */
	public static function delete( $key ) {
		delete_option( self::key( $key ) );
	}
}
